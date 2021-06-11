/* eslint-disable @typescript-eslint/no-var-requires */
const { execSync } = require('child_process');

const FIREBASE_APPS_LIST_OUTPUT_ENTRY_REGEX = /^│([^│]+)│([^│]+)│([^│]+)│$/gm;

function getActiveProject() {
  return (
    process.env.GCLOUD_PROJECT ||
    execSync(`echo "$(firebase use)"`).toString().trim()
  );
}

function getFirebaseApps(projectId = getActiveProject()) {
  const firebaseAppsListOutput = execSync(
    `echo "$(firebase apps:list --project ${projectId})"`,
  );

  return (
    firebaseAppsListOutput
      .toString()
      .match(FIREBASE_APPS_LIST_OUTPUT_ENTRY_REGEX) || []
  )
    .slice(1)
    .map(
      (s) =>
        s.match(new RegExp(FIREBASE_APPS_LIST_OUTPUT_ENTRY_REGEX, '')) || [],
    )
    .map(([, a, b, c]) => ({
      appDisplayName: a.trim(),
      appId: b.trim(),
      platform: c.trim(),
    }))
    .filter((o) => o && o.appId);
}

function getFirebaseWebApp(projectId = getActiveProject()) {
  const apps = getFirebaseApps(projectId);
  const webApps = apps.filter((app) => app.platform === 'WEB');

  if (webApps.length < 1) {
    throw new Error(
      `It seems that you do not have any web apps in the Firebase project ${projectId}. Run \`firebase apps:create web\` to create one.`,
    );
  }

  if (webApps.length > 1) {
    throw new Error(
      `It seems that you do not have mutiple web apps: ${webApps
        .map((app) => app.appDisplayName)
        .join(
          ', ',
        )} in the Firebase project ${projectId}. Having mutiple web apps in a Firebase project is currently unsupported.`,
    );
  }

  return webApps[0];
}

module.exports = {
  getFirebaseApps,
  getFirebaseWebApp,
};
