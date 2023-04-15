//import fs from "fs/promises";
const fs = require('fs');
import { existsSync } from "fs";
import path from "path";
import { camelCase } from "lodash";
import { Idl } from "@project-serum/anchor";

async function writeIdlTypes(idlPath: string, idl: Idl) {
  const typesPath = path.join(idlPath, "types.ts");
  if (existsSync(typesPath)) {
    return;
  }

  const idlName = idl.name[0].toUpperCase() + idl.name.slice(1);
  const instructions = idl.instructions
    .map((ix) => {
      const ixName = camelCase(ix.name);
      const args = ix.args.map((arg) => `${arg.name}: ${arg.type}`).join(", ");
      const accounts = `{
        ${ix.accounts.map((acc) => camelCase(acc.name)).join(", ")}
      }`;
      return `  ${ixName}: {
      (): Promise<void>;
      (opts: { ${args} }, ctx: Context<${accounts}>): Promise<void>;
    };`;
    })
    .join("\n");

  const accounts = idl.accounts
    .map((account) => {
      const accName = camelCase(account.name);
      const fields = account.type.fields
        .map((field) => `${field.name}: ${field.type};`)
        .join("\n    ");
      return `export interface ${accName} extends AccountInfo {
    data: {
      ${fields}
    };
  }`;
    })
    .join("\n\n");

  const template = fs.readFileSync(
    path.join(__dirname, "..", "..", "templates", "idlTypes.ts"),
    "utf8"
  );
  const typesTs = template
    .replace(/{{idlName}}/g, idlName)
    .replace("{{instructions}}", instructions)
    .replace("{{accounts}}", accounts);

  await fs.writeFile(typesPath, typesTs);
}
