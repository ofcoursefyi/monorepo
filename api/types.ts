import { Empty } from "./helpers";

export type ApiDepartment = {
  code: string;
  name: string;
  type: "Y" | "N" | "C";
};

export type DepartmentsResponse = {
  department: {
    code: string;
    name: string;
    type: "Y";
    department: ApiDepartment | ApiDepartment[];
  }[];
};

export type ApiInstructor = {
  last_name: string;
  first_name: string;
};

export type ApiSection = {
  id: string;
  session: string;
  dclass_code: "R" | "D";
  title: string;
  section_title: string | Empty;
  description: string | Empty;
  notes: string | Empty;
  type: "Lec" | "Dis" | "Lab" | "Lec-Dis" | "Qz" | "Lec-Lab";
  units: string | Empty;
  spaces_available: string;
  number_registered: string;
  wait_qty: string;
  canceled: "Y" | "N";
  day: string | Empty | null | [string, string];
  start_time: `${number}:${number}` | null | "TBA" | [`${number}:${number}`, `${number}:${number}`];
  end_time: `${number}:${number}` | null | "TBA" | [`${number}:${number}`, `${number}:${number}`];
  location: string | Empty | null;
  instructor: ApiInstructor[] | ApiInstructor | null;
};

export type ApiCourse = {
  IsCrossListed: "Y" | "N";
  PublishedCourseID: `${string}-${string}`;
  ScheduledCourseID: `${string}-${string}`;
  CourseData: {
    prefix: string;
    number: `${number}`;
    sequence: string | Empty;
    suffix: string | Empty;
    title: string;
    description: string | Empty;
    units: string;
    restriction_by_major: string | Empty;
    restriction_by_class: string | Empty;
    restriction_by_school: string | Empty;
    CourseNotes: string | Empty;
    CourseTermNotes: Empty;
    prereq_text: string | Empty;
    coreq_text: string | Empty;
    SectionData: ApiSection | ApiSection[];
  };
};

export type ClassesResponse = {
  schd_sync_dtm: string;
  Dept_Info: {
    department: string;
    abbreviation: string;
  };
  OfferedCourses: {
    course: ApiCourse | ApiCourse[];
  };
};
