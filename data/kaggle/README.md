# Kaggle datasets for thesis evaluation

This directory holds the two public datasets used to evaluate the JD-CV
matching engine. The files are **not committed to git** (see `.gitignore`)
because of size and license terms — you must download them yourself.

## Required files

```
data/kaggle/
├── Resume.csv              # Kaggle: "Resume Dataset" by snehaanbhawal
└── JobPostings.csv         # Kaggle: "Job Postings" or similar
```

## Option 1 — Kaggle CLI (recommended)

```bash
# One-time setup
pip install kaggle
# Drop your API token at ~/.kaggle/kaggle.json (download from kaggle.com/settings)
chmod 600 ~/.kaggle/kaggle.json

# Download
cd data/kaggle
kaggle datasets download -d snehaanbhawal/resume-dataset --unzip
mv data/Resume/Resume.csv ./Resume.csv
rm -rf data/Resume Resume.pdf  # cleanup

# Job descriptions — pick one and rename to JobPostings.csv
kaggle datasets download -d arshkon/linkedin-job-postings --unzip
mv postings.csv JobPostings.csv
```

## Option 2 — Manual download

1. Resume Dataset: https://www.kaggle.com/datasets/snehaanbhawal/resume-dataset
   - Download `archive.zip` → extract → put `Resume.csv` here
   - Expected columns: `ID`, `Resume_str`, `Resume_html`, `Category`
   - ~2,484 rows, 24 categories (Java Developer, Data Science, HR, etc.)

2. Job Postings: https://www.kaggle.com/datasets/arshkon/linkedin-job-postings
   - (or any other JD dataset with `Job Title` + `Job Description` columns)
   - Rename main CSV → `JobPostings.csv`
   - Will be sampled to ~500 rows during evaluation

## After download — verify

Run the loader to confirm parsing works and report stats:

```bash
npx tsx scripts/load-kaggle-data.ts
```

Expected output: row counts, category distribution, sample row preview.

## License notes

Both datasets are public on Kaggle but check each dataset's license page
before redistributing. For a thesis appendix, citing the Kaggle URL +
download date is sufficient. Do not commit the CSVs to this repo.
