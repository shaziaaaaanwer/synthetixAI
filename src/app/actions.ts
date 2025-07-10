
'use server';

import {z} from 'zod';
import { google } from 'googleapis';
import { Octokit } from '@octokit/rest';

const sendToWebhookSchema = z.object({
  dataset: z.string().min(1, 'Dataset cannot be empty.'),
  url: z.string().url('Invalid webhook URL.'),
});

export async function sendToWebhookAction(input: {
  dataset: string;
  url: string;
}) {
  const validatedFields = sendToWebhookSchema.safeParse(input);

  if (!validatedFields.success) {
    return {
      error: 'Invalid input. Please provide a valid dataset and URL.',
    };
  }

  const {dataset, url} = validatedFields.data;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: dataset,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        error: `Request failed with status ${response.status}: ${errorBody}`,
      };
    }

    return {success: true};
  } catch (error) {
    console.error('Webhook Error:', error);
    return {
      error: 'Failed to send data to the webhook. Please check the URL and try again.',
    };
  }
}

const sendToGoogleSheetsSchema = z.object({
  dataset: z.string().min(1, 'Dataset cannot be empty.'),
  accessToken: z.string().min(1, 'Access token is required.'),
});

export async function sendToGoogleSheetsAction(input: {
  dataset: string;
  accessToken: string;
}) {
  const validatedFields = sendToGoogleSheetsSchema.safeParse(input);

  if (!validatedFields.success) {
    return {
      error: 'Invalid input. Please provide a valid dataset and access token.',
    };
  }
  const { dataset, accessToken } = validatedFields.data;

  try {
    const data = JSON.parse(dataset);
    if (!Array.isArray(data) || data.length === 0) {
      return { error: 'Dataset is empty or not a JSON array.' };
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const sheets = google.sheets({ version: 'v4', auth });

    // 1. Create a new spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `SynthetiX.AI Generated Data - ${new Date().toLocaleString()}`,
        },
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;
    if (!spreadsheetId) {
        return { error: 'Failed to create Google Sheet.' };
    }

    // 2. Prepare data for the sheet
    const headers = Object.keys(data[0]);
    const values = [
      headers,
      ...data.map((row) => headers.map((header) => String(row[header] ?? ''))),
    ];

    // 3. Write data to the sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });
    
    return { success: true, url: spreadsheet.data.spreadsheetUrl };

  } catch (error: any) {
    // Log the full error for better debugging from logs if needed
    console.error('Google Sheets Error:', JSON.stringify(error, null, 2));

    const isPermissionError = error.code === 403;
    const errorMessage = error.response?.data?.error?.message || error.message;

    if (isPermissionError) {
        return {
            error: `Permission Denied. Your intuition about Client IDs is correct—this is likely a project configuration mismatch. Please follow this definitive checklist carefully:

1.  **Verify Project ID:** The most common issue. In your Google Cloud Console, find the Project ID for the project where the Sheets API is enabled. Ensure this EXACTLY matches the \`NEXT_PUBLIC_FIREBASE_PROJECT_ID\` value in your app's environment file. If they are different, you are configuring the wrong project.
2.  **Enable API:** Confirm the 'Google Sheets API' is enabled in that specific Google Cloud project.
3.  **Check OAuth Scopes:** On that project's 'OAuth consent screen', go to 'Edit App' -> 'Scopes'. Ensure the \`.../auth/spreadsheets\` scope is listed.
4.  **Check Test User:** On the 'OAuth consent screen', ensure the email you are using to sign into THIS APP is listed as a "Test User".
5.  **Perform a FULL Re-authentication:** This is critical to clear old, cached permissions.
    a. Sign out of this application.
    b. Go to google.com and sign out of ALL Google accounts in your browser.
    c. Sign back into Google using ONLY the account you've added as a test user.
    d. Sign back into this application and try again. The Google login popup should now explicitly ask for permission to edit your spreadsheets.

Error Details: ${errorMessage}`
        };
    }
    
    // Fallback for other errors
    return { error: `An unexpected error occurred: ${errorMessage}. Please try again.` };
  }
}

const sendToGistSchema = z.object({
  dataset: z.string().min(1, 'Dataset cannot be empty.'),
  token: z.string().min(1, 'GitHub token is required.'),
  filename: z.string().min(1, 'Filename is required.'),
  description: z.string().optional(),
});

export async function sendToGistAction(input: {
  dataset: string;
  token: string;
  filename: string;
  description?: string;
}) {
  const validatedFields = sendToGistSchema.safeParse(input);

  if (!validatedFields.success) {
    return { error: 'Invalid input. Please provide a valid dataset, token, and filename.' };
  }

  const { dataset, token, filename, description } = validatedFields.data;

  try {
    const octokit = new Octokit({ auth: token });

    const response = await octokit.gists.create({
      description: description || `Dataset from SynthetiX.AI`,
      public: false,
      files: {
        [filename]: {
          content: dataset,
        },
      },
    });

    if (response.status === 201 && response.data.html_url) {
      return { success: true, url: response.data.html_url };
    } else {
      return { error: `GitHub API returned status ${response.status}.` };
    }
  } catch (error: any) {
    console.error('GitHub Gist Error:', error);
    if (error.status === 401) {
      return { error: 'Authentication failed. Please check your GitHub Personal Access Token.' };
    }
    return { error: `Failed to create Gist: ${error.message}` };
  }
}

const sendToColabSchema = z.object({
  dataset: z.string().min(1, 'Dataset cannot be empty.'),
  token: z.string().min(1, 'GitHub token is required.'),
  filename: z.string().min(1, 'Filename is required.'),
});

// Helper to create the .ipynb content with embedded data
function createColabNotebookContent(dataset: string, dataFilename: string): string {
    // Escape backticks and dollar signs for embedding in the template literal.
    const escapedDataset = dataset.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    const isJson = dataFilename.endsWith('.json');

    const code = `
import pandas as pd
import json
from io import StringIO

# The dataset is embedded directly as a multi-line string.
raw_data = """${escapedDataset}"""

try:
    # Attempt to load the data into a pandas DataFrame
    if ${isJson}:
        df = pd.read_json(StringIO(raw_data))
        print("Successfully loaded data as JSON.")
    else:
        df = pd.read_csv(StringIO(raw_data))
        print("Successfully loaded data as CSV.")

    print("\\nHere are the first 5 rows of your data:")
    display(df.head())

except Exception as e:
    print(f"An error occurred while loading the data: {e}")
    print("\\n--- Raw Data Snippet ---")
    print(raw_data[:1000] + ('...' if len(raw_data) > 1000 else ''))
`.trim();

    const notebook = {
        nbformat: 4,
        nbformat_minor: 0,
        metadata: {
            kernelspec: {
                name: "python3",
                display_name: "Python 3"
            },
            language_info: {
                name: "python"
            }
        },
        cells: [{
            cell_type: "code",
            execution_count: null,
            metadata: {},
            outputs: [],
            source: code.split('\n')
        }]
    };

    return JSON.stringify(notebook, null, 2);
}


export async function sendToColabAction(input: {
  dataset: string;
  token: string;
  filename: string;
}) {
  const validatedFields = sendToColabSchema.safeParse(input);

  if (!validatedFields.success) {
    return { error: 'Invalid input. Please provide a valid dataset, token, and filename.' };
  }

  const { dataset, token, filename } = validatedFields.data;
  const octokit = new Octokit({ auth: token });
  const notebookFilename = `analysis_notebook.ipynb`;

  try {
    // Step 1: Create the self-contained notebook content
    const notebookContent = createColabNotebookContent(dataset, filename);

    // Step 2: Create a single Gist with only the notebook file
    const gist = await octokit.gists.create({
        description: `Colab Notebook for dataset from SynthetiX.AI`,
        public: false,
        files: {
            [notebookFilename]: {
                content: notebookContent,
            },
        },
    });

    if (gist.status !== 201) {
        return { error: `GitHub API returned status ${gist.status} for Gist creation.` };
    }
    
    const gistId = gist.data.id;
    if (!gistId) {
        return { error: 'Could not get Gist ID from GitHub response.' };
    }
    
    const ownerLogin = gist.data.owner?.login;
    if (!ownerLogin) {
        return { error: 'Could not get Gist owner from GitHub response.' };
    }
    
    // Step 3: Construct the Colab URL
    const colabUrl = `https://colab.research.google.com/gist/${ownerLogin}/${gistId}/${notebookFilename}`;

    return { success: true, url: colabUrl };

  } catch (error: any) {
    console.error('Google Colab/Gist Error:', error);
    if (error.status === 401) {
      return { error: 'Authentication failed. Please check your GitHub Personal Access Token.' };
    }
    return { error: `Failed to create Gist for Colab: ${error.message}` };
  }
}
