const fs = require("fs");
const path = require("path");

const source = path.join(__dirname, "../Components/enter-mobile.jsx");
const target = path.join(__dirname, "../src/data/countryOptions.js");
const text = fs.readFileSync(source, "utf8");
const match = text.match(/const COUNTRIES = \[([\s\S]*?)\];/);

if (!match) {
  throw new Error("Could not find COUNTRIES array in enter-mobile.jsx");
}

const helpers = `
export const DEFAULT_COUNTRY =
  COUNTRY_OPTIONS.find((item) => item.name === "India") ?? COUNTRY_OPTIONS[0];

export const findCountryByName = (name) =>
  COUNTRY_OPTIONS.find((item) => item.name === name) ?? null;

export const findCountryByCode = (code) =>
  COUNTRY_OPTIONS.find((item) => item.code === code) ?? null;

export const formatCountryLabel = (country, countryCode) => {
  const match = country ? findCountryByName(country) : findCountryByCode(countryCode);
  if (match) return \`\${match.flag} \${match.name} (\${match.code})\`;
  if (country && countryCode) return \`\${country} (\${countryCode})\`;
  if (country) return country;
  return "";
};
`;

const output = `/** Shared country list with dial codes. */
export const COUNTRY_OPTIONS = [${match[1]}];
${helpers}`;

fs.writeFileSync(target, output);
