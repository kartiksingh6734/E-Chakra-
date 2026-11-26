# Enable Google and mobile sign-in for E-CHAKRA

The collector prototype and its public walkthrough run on [GitHub Pages](https://kartiksingh6734.github.io/E-Chakra-/). Firebase Authentication verifies Google accounts and mobile numbers. The signed-in collector's lots, photos and receipts stay in this browser. The walkthrough opens without an account.

## 1. Register the web app

Open the [Firebase console](https://console.firebase.google.com/), create or select your project, and add a **Web** app. In **Project settings → General → Your apps → SDK setup and configuration**, select **Config**. Keep the web app's `apiKey`, `authDomain`, `projectId` and `appId` for step 3. GitHub already hosts the site.

## 2. Enable the sign-in providers

1. In **Authentication → Sign-in method**, enable **Google**, choose the project's support email and save.
2. Enable **Phone** and save. In **Authentication → Settings → SMS region policy**, allow the countries where you intend to send verification codes. For Indian mobile numbers, allow India and enter the number with `+91`.
3. In **Authentication → Settings → Authorized domains**, add **kartiksingh6734.github.io**. Enter the hostname without a scheme or repository path.
4. To try phone sign-in during setup, configure a fictional test number and a six-digit test code in the Phone provider settings. This avoids sending SMS. Real SMS requires Firebase's pay-as-you-go Blaze plan, supported destinations and available quota. Review the pricing before enabling billing.

[Google sign-in](https://firebase.google.com/docs/auth/web/google-signin) · [Phone sign-in and test numbers](https://firebase.google.com/docs/auth/web/phone-auth) · [SMS limits and billing](https://firebase.google.com/docs/auth/limits)

## 3. Connect the GitHub Pages site

[Edit firebase-config.json on the gh-pages branch](https://github.com/kartiksingh6734/E-Chakra-/edit/gh-pages/firebase-config.json). Replace the empty object with valid JSON using the **public web app values** from step 1. The file should look like this after you substitute your values.

```json
{
  "apiKey": "YOUR_WEB_API_KEY",
  "authDomain": "YOUR_PROJECT.firebaseapp.com",
  "projectId": "YOUR_PROJECT_ID",
  "appId": "YOUR_WEB_APP_ID"
}
```

Commit the edit to **gh-pages**. This configuration is public. Keep service-account files, private keys, passwords and verification codes out of it. A configuration edit requires no JavaScript rebuild. After the [Pages deployment](https://github.com/kartiksingh6734/E-Chakra-/actions/workflows/pages/pages-build-deployment) completes, reload the [prototype](https://kartiksingh6734.github.io/E-Chakra-/).

## 4. Verify

Choose **Continue with Google** and select an account. Create a synthetic lot and sign out. Next, enter the test mobile number, choose **Send SMS code**, and enter its configured test code. The workspace belongs to the Firebase user who signed in. Signing back into the original account in the same browser restores that account's lot.

The Pages build keeps records in IndexedDB and can reopen a previously loaded workspace offline. Clearing the site's browser data removes its local records. A second device starts with its own records. The local Worker version has separate D1/R2 storage.
