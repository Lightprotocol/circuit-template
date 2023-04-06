const p1 = Promise.resolve(3.14);
console.log(p1);

(async () => {
    const x = await p1;
    console.log(x);
    
})();

type ParseArrayType<T> = T extends `${infer U}[]` ? Array<ParseType<U>> : T;

type ParseType<T> =
  T extends 'string' ? string :
  T extends 'number' ? number :
  T extends 'boolean' ? boolean :
  ParseArrayType<T>;

let b = 'number[]'; 
 
type MyType = ParseType<'number[]'>; // MyType is number[]
type MyString = ParseType<'string[]'>;
const a: MyString = ['s', 'b', 'c']
console.log(typeof a);

const input = {
    a: 'string',
    b: 'Array<string>',
    c: 'Array<Array<string>>',
    d: 'Array<Array<Array<string>>>',
    e: 'Array<Array<Array<Array<string>>>>'
  };