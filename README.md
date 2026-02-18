# Laska Legacy - Invoice Management System

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Invoice System Setup

The invoice system has been upgraded with sequential numbering, approval workflow, and email sending capabilities.

### Required Environment Variables

For the email sending feature to work, you need to configure the following environment variables:

#### For Local Development:
Create a `.env.local` file in the root directory with:

```
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=Laska Legacy <noreply@laskalegacy.com>
```

#### For Vercel Deployment:
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:
   - `RESEND_API_KEY`: Your Resend API key (get from https://resend.com/api-keys)
   - `RESEND_FROM_EMAIL`: (Optional) Custom from email address. Default: "Laska Legacy <noreply@laskalegacy.com>"

### Getting Resend API Key

1. Sign up at [Resend](https://resend.com)
2. Go to API Keys section
3. Create a new API key
4. Copy the key and add it to your environment variables

### Invoice System Features

- **Sequential Invoice Numbering**: Format `INV-YYYY-XXXX` (e.g., `INV-2025-0001`)
- **Invoice Approval Workflow**: Draft → Approved → Sent
- **Email Sending**: Automatically sends professional HTML emails with PDF attachments
- **Invoice Management**: Track invoice status, history, and metadata
- **Duplicate Prevention**: Prevents generating multiple invoices for the same inquiry

### Invoice Workflow

1. **Generate Invoice**: Creates invoice with status `draft`
2. **Approve Invoice**: Admin approves invoice (status → `approved`)
3. **Send Email**: Sends invoice to client via email (status → `sent`)
4. **Download**: Invoice can be downloaded at any time

---

# Getting Started with Create React App

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
