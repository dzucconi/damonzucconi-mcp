import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "https://api.damonzucconi.com/graph",
  documents: ["src/graphql/**/*.graphql"],
  generates: {
    "./schema.graphql": {
      plugins: ["schema-ast"],
    },
    "./src/generated/": {
      preset: "client",
      presetConfig: {
        fragmentMasking: false,
      },
      config: {
        documentMode: "string",
        namingConvention: "keep",
        useTypeImports: true,
        skipTypename: true,
        enumsAsConst: true,
        maybeValue: "T | undefined",
        inputMaybeValue: "T | undefined",
        scalars: {
          ISO8601Date: "string",
          BigInt: "number",
        },
      },
    },
  },
};

export default config;
