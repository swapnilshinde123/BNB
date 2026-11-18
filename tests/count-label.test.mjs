import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=ts.transpileModule(readFileSync(new URL('../lib/count-label.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022}}).outputText;
const {countLabel}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('one uses singular, including counts from form inputs',()=>{for(const noun of ['guest','bedroom','bathroom','night','photo','booking','home']){assert.equal(countLabel(1,noun),`1 ${noun}`);assert.equal(countLabel('1',noun),`1 ${noun}`)}});
test('zero and multiple counts use plural',()=>{for(const n of [0,2,6])assert.equal(countLabel(n,'bedroom'),`${n} bedrooms`)});
test('irregular plurals remain correct',()=>{assert.equal(countLabel(1,'property','properties'),'1 property');assert.equal(countLabel(2,'property','properties'),'2 properties')});
