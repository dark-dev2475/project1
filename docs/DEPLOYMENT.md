# Streamlit deployment

The Streamlit app imports the same tax kernel and dataset validators used by the CLI.
It reads committed benchmark artifacts; neither Node nor pytest is needed to serve it.

## Run locally

```sh
python -m pip install -r requirements.txt
python -m streamlit run streamlit_app.py
```

## Community Cloud

1. Sign into https://share.streamlit.io with the GitHub account that can access the repository.
2. Create an app with repository `dark-dev2475/project1`, branch `main`, entrypoint `streamlit_app.py`.
3. Select Python 3.13 in Advanced settings (the locally tested version).
4. Paste secrets into the Advanced settings Secrets field:

```toml
GEMINI_API_KEY = "your-key"
GEMINI_MODEL = "gemini-3.5-flash-lite"
GEMINI_MAX_CALLS = "40"
```

5. Click Deploy. Check Overview, a tax calculation, the Orders example, and the Evidence page.

Do not commit `.env` or `.streamlit/secrets.toml`. The example secrets file contains no credentials.
The app also works without a key; live Gemini comparison is then disabled.

The provider rejected Gemini 2.5 Flash-Lite for this account on 2026-11-25 and recommended
3.5 Flash-Lite. Temporary 503 responses are displayed as unavailable, not successful results.
Current published text prices for 3.5 Flash-Lite are $0.30 input and $2.50 output per million
tokens; reported costs are paid equivalents, not verified account charges.

Live calls require a separate button and consent to send the salary profile to Google.
A locked, process-wide client shares a 40-attempt budget across visitors. This resets on app
restart and is a demo safeguard, not a durable billing cap. Set provider-side quotas for a public app.
Uploaded datasets never go to Gemini. They use temporary server files that are deleted after validation;
results live in the visitor's Streamlit session. Interactive files are limited to 2 MB and 1,000 rows;
use the CLI for larger batches. Do not upload confidential data to a public demo.

The assignment requests `AI_USAGE.md`; it has been excluded at the repository owner's request.
Its absence is an outstanding submission requirement. Existing Git history retains earlier committed files.

Official instructions:
- https://docs.streamlit.io/deploy/streamlit-community-cloud/deploy-your-app/deploy
- https://docs.streamlit.io/deploy/streamlit-community-cloud/deploy-your-app/secrets-management
- https://ai.google.dev/gemini-api/docs/pricing
