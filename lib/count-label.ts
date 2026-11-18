export function countLabel(count:number|string,singular:string,plural=singular+'s'){
 return `${count} ${Number(count)===1?singular:plural}`;
}
