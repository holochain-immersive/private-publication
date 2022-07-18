import grant from "./grant";
import invite from "./invite";
if (!process.env["EXERCISE"] || process.env["EXERCISE"] === "1") {
  grant();
}
if (!process.env["EXERCISE"] || process.env["EXERCISE"] === "2") {
  invite();
}
