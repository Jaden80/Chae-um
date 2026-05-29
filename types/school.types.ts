export interface School {
  atptOfcdcScCode: string;
  sdSchulCode: string;
  schulNm: string;
  engSchuNm?: string;
  schulKndScCode: string;
  schulKndScNm: string;
  lctnScCode: string;
  lctnScNm: string;
  juOrgNm: string;
  orgRdnma: string;
  orgRdnZip?: string;
  telNo: string;
  faxNo?: string;
  atptOfcdcScNm: string;
}

export interface SchoolClass {
  atptOfcdcScCode: string;
  sdSchulCode: string;
  AY: string;
  grade: string;
  classNm: string;
  dddepNm?: string;
}

export interface Teacher {
  id: string;
  name: string;
  position: string;
  grade?: string;
  classNm?: string;
  phone: string;
  role?: string;
  isLeader?: boolean;
}

export interface SchoolSnapshot {
  school: School;
  classes: SchoolClass[];
  principal?: Teacher;
  vPrincipal?: Teacher;
  admin?: Teacher;
  teachers: Teacher[];
  loadedAt: string;
}
