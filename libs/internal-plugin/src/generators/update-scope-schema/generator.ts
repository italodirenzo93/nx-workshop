import {
  formatFiles,
  updateJson,
  Tree,
  getProjects,
  ProjectConfiguration,
} from '@nrwl/devkit';

function getScopes(projectMap: Map<string, ProjectConfiguration>) {
  const projects: any[] = Array.from(projectMap.values());
  const allScopes: string[] = projects
    .map((project) =>
      project.tags
        // take only those that point to scope
        .filter((tag: string) => tag.startsWith('scope:'))
    )
    // flatten the array
    .reduce((acc, tags) => [...acc, ...tags], [])
    // remove prefix `scope:`
    .map((scope: string) => scope.slice(6));
  // remove duplicates
  return Array.from(new Set(allScopes));
}

function updateSchemaJson(tree: Tree, scopes: string[]) {
  updateJson(
    tree,
    'libs/internal-plugin/src/generators/util-lib/schema.json',
    (json) => {
      json.properties.directory['x-prompt'].items = scopes.map((scope) => ({
        value: scope,
        label: scope,
      }));
      return json;
    }
  );
}

function updateSchemaInterface(tree: Tree, scopes: string[]) {
  const joinScopes = scopes.map((s) => `'${s}'`).join(' | ');
  const interfaceDefinitionFilePath =
    'libs/internal-plugin/src/generators/util-lib/schema.d.ts';
  const newContent = `export interface UtilLibGeneratorSchema {
    name: string;
    directory: ${joinScopes};
  }`;
  tree.write(interfaceDefinitionFilePath, newContent);
}

export default async function (tree: Tree) {
  const scopes = getScopes(getProjects(tree));

  updateSchemaJson(tree, scopes);
  updateSchemaInterface(tree, scopes);

  await formatFiles(tree);
}
