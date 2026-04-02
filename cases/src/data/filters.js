import { cases } from "./cases.js";

function optionsFor(field) {
  return ["不限", ...new Set(cases.map((item) => item[field]).filter(Boolean))];
}

function buildSchoolMajorSections() {
  const schools = [...new Set(cases.map((item) => item.undergradSchool).filter(Boolean))];

  return schools.map((school) => {
    const majors = [
      "不限",
      ...new Set(
        cases
          .filter((item) => item.undergradSchool === school)
          .map((item) => item.undergradMajor)
          .filter(Boolean),
      ),
    ];

    return {
      title: cases.find((item) => item.undergradSchool === school)?.undergradSchoolLabel || school,
      schoolValue: school,
      field: "undergradMajor",
      options: majors,
    };
  });
}

export const filterGroups = [
  {
    id: "season",
    label: "申请季",
    field: "applicationSeason",
    options: optionsFor("applicationSeason"),
  },
  {
    id: "program",
    label: "院校专业",
    field: "undergradMajor",
    sections: buildSchoolMajorSections(),
  },
  {
    id: "region",
    label: "国家（地区）",
    field: "offerRegion",
    options: optionsFor("offerRegion"),
  },
];
