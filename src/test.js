export default async function test() {
  const result = test2();
  console.log(result);
}

export function test2() {
  return "finished";
}
