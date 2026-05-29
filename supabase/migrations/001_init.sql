-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. schools (학교 정보 캐시)
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    neis_code VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    lat NUMERIC,
    lng NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. users (교사)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    role VARCHAR(50) DEFAULT 'teacher' CHECK (role IN ('teacher', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. places (체험처 캐시) - events에서 참조하므로 먼저 생성
CREATE TABLE places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(50) CHECK (source IN ('kywa', 'data_go_kr')),
    external_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    address TEXT,
    lat NUMERIC,
    lng NUMERIC,
    phone VARCHAR(255),
    website TEXT,
    reservation_required BOOLEAN DEFAULT false,
    operating_hours JSONB,
    certified BOOLEAN DEFAULT false,
    certification_info JSONB,
    safety_score NUMERIC(3,2) CHECK (safety_score >= 0 AND safety_score <= 5),
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source, external_id)
);

-- 3. events (현장체험학습 이벤트)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    subject VARCHAR(255),
    grade INTEGER,
    unit VARCHAR(255),
    trip_date DATE,
    student_count INTEGER,
    type VARCHAR(50) CHECK (type IN ('1일형', '숙박형', '수련활동', '국외')),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'searching', 'selected', 'document_ready', 'completed')),
    selected_place_id UUID REFERENCES places(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. recommendations (추천 결과 저장)
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    match_score INTEGER,
    match_reason TEXT,
    distance_km NUMERIC,
    rank INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. documents (생성된 문서)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    type VARCHAR(50) CHECK (type IN ('basic_plan', 'parent_notice', 'previsit_report', 'safety_plan')),
    content_md TEXT,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. previsit_checklists
CREATE TABLE previsit_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    checklist_data JSONB,
    photos JSONB, -- array of {url, caption, ai_analysis}
    report_md TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE
);

-- Row Level Security (RLS) Settings
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE previsit_checklists ENABLE ROW LEVEL SECURITY;

-- Schools: 누구나 조회 가능 (캐시성 공용 데이터)
CREATE POLICY "Schools are viewable by everyone" ON schools FOR SELECT USING (true);
CREATE POLICY "Schools are insertable by authenticated users" ON schools FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Places: 누구나 조회 가능 (캐시성 공용 데이터)
CREATE POLICY "Places are viewable by everyone" ON places FOR SELECT USING (true);
CREATE POLICY "Places are insertable by authenticated users" ON places FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Places are updatable by authenticated users" ON places FOR UPDATE USING (auth.role() = 'authenticated');

-- Users: 본인 정보만 조회 및 수정 가능
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Events: 본인 이벤트만 조회, 생성, 수정, 삭제 가능
CREATE POLICY "Events are viewable by owner" ON events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Events are insertable by owner" ON events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Events are updatable by owner" ON events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Events are deletable by owner" ON events FOR DELETE USING (auth.uid() = user_id);

-- Recommendations: 소유한 이벤트에 속한 추천 결과만 조회 가능
CREATE POLICY "Recommendations viewable by event owner" ON recommendations FOR SELECT USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = recommendations.event_id AND events.user_id = auth.uid())
);
CREATE POLICY "Recommendations insertable by event owner" ON recommendations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM events WHERE events.id = event_id AND events.user_id = auth.uid())
);
CREATE POLICY "Recommendations deletable by event owner" ON recommendations FOR DELETE USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = recommendations.event_id AND events.user_id = auth.uid())
);

-- Documents: 소유한 이벤트에 속한 문서만
CREATE POLICY "Documents viewable by event owner" ON documents FOR SELECT USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = documents.event_id AND events.user_id = auth.uid())
);
CREATE POLICY "Documents modifiable by event owner" ON documents FOR ALL USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = documents.event_id AND events.user_id = auth.uid())
);

-- Previsit Checklists: 소유한 이벤트에 속한 사전답사 결과만
CREATE POLICY "Previsit checklists viewable by event owner" ON previsit_checklists FOR SELECT USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = previsit_checklists.event_id AND events.user_id = auth.uid())
);
CREATE POLICY "Previsit checklists modifiable by event owner" ON previsit_checklists FOR ALL USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = previsit_checklists.event_id AND events.user_id = auth.uid())
);

-- Trigger for events updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_modtime
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
