type KeyValue = {
  [key: string]: any;
};
export function pickFields<T extends KeyValue>(obj: T,accounts: any[], accountName: string): Partial<KeyValue> {
  const utxoAppData = accounts.find((account) => account.name === accountName);

  if (!utxoAppData) {
    throw new Error("utxoAppData does not exist in idl");
  }

  const fieldNames = utxoAppData.type.fields.map((field: { name: string }) => field.name);
  const appDataKeys: (keyof T)[] = [];

  fieldNames.forEach((fieldName: string) => {
      appDataKeys.push(fieldName);
  });

  let appData: Partial<T> = {};

  appDataKeys.forEach((key) => {
      appData[key] = obj[key];
      if(!appData[key])
          throw new Error(`Property ${key.toString()} undefined`);
  })
  return appData;
}