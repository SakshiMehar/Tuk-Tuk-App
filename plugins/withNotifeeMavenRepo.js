const { withProjectBuildGradle } = require("@expo/config-plugins");

const NOTIFEE_MAVEN_ENTRY = 'maven { url "$rootDir/../node_modules/@notifee/react-native/android/libs" }';

function addNotifeeMavenRepo(buildGradle) {
  // If already present, don't add again (idempotent)
  if (buildGradle.includes("@notifee/react-native/android/libs")) {
    return buildGradle;
  }

  // Look for allprojects { repositories { ... } }
  const pattern = /allprojects\s*\{\s*repositories\s*\{/;
  if (pattern.test(buildGradle)) {
    return buildGradle.replace(pattern, (match) => {
      return `${match}\n    ${NOTIFEE_MAVEN_ENTRY}`;
    });
  }

  // Fallback: append an allprojects repositories block if not matched
  return `${buildGradle}\n\nallprojects {\n  repositories {\n    ${NOTIFEE_MAVEN_ENTRY}\n  }\n}\n`;
}

const withNotifeeMavenRepo = (config) => {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === "groovy") {
      config.modResults.contents = addNotifeeMavenRepo(config.modResults.contents);
    } else {
      throw new Error("Cannot add Notifee Maven repo because project build.gradle is not Groovy");
    }
    return config;
  });
};

module.exports = withNotifeeMavenRepo;
