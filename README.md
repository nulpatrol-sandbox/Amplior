# VueGen-CLI Tool
### About
Tool for generation JavaScript code for project.
http://pksunkara.com/posts/complex-vuejs-app-structure/
### Usage
```sh
$ vuegen store <moduleName> <stateStructure>
```

where ```<stateStructure>``` is list of fields in state separated by "|". If field is object use "objectName(field1, field2, field3,...)" syntax.

For example:
```sh
$ vuegen store contract "step|buildingType|contractType|tenant(address, name, id, phone)"
```
generates next state:
```js
const state = {
    step: undefined,
    buildingType: undefined,
    contractType: undefined,
    tenant: {
        address: undefined,
        name: undefined,
        id: undefined,
        phone: undefined,
    }
};
```
and getters, mutations, mutation types and mixins with computed fields.