# Label schemas

CC0 schema copies from the AppFacts and FeatureFacts projects:

- https://appfacts.dev/schema/app-facts.schema.json
- https://featurefacts.dev/schema/v0.2.0/feature-facts-label.schema.json
- https://featurefacts.dev/schema/v0.2.0/common.schema.json

Root `APP_FACTS.md` and `FEATURE_FACTS.md` frontmatter own the declarations.
`npm run facts` validates them and refreshes public projections/viewer links.
FeatureFacts is explicitly standalone and assistant-declared; it is not a
source-freshness or full-inventory check.
