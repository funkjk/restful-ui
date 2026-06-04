import type { OpenAPI, OpenAPIV3 } from "openapi-types";

export interface PathTreeObject {
    label: string;
    children: PathTreeObject[];
    targetApi?: {path:string, api: OpenAPIV3.PathsObject}
}

export class PathTree {
    constructor(document: OpenAPI.Document) {
        this.document = document
        this.pathTree = this.initializePathTree()
    }
    pathTree: PathTreeObject;
    document: OpenAPI.Document;
    initializePathTree(): PathTreeObject {
        const doc = this.document
        const tree = {
            label: "/",
            children: [],
        } as PathTreeObject;
        for (const p in doc!.paths) {
            const splitedPath = p.slice(1).split("/");
            let currentPath = tree;
            for (const sp of splitedPath) {
                const label = sp + "/";
                if (
                    currentPath.children.filter((e) => e.label == label).length == 0
                ) {
                    currentPath.children.push({
                        label,
                        children: []
                    });
                }
                currentPath = currentPath.children.filter((e) => e.label == label)[0]
            }
            currentPath.targetApi = { path: p, api: doc!.paths[p] as OpenAPIV3.PathsObject };
        }
        return tree;
    }

    getTargetPathTree(path:string) {
        const pathTreeValue = this.pathTree

        let targetPathTree = pathTreeValue
        for (const p of path.split("/")) {
            if (p == "") {
                continue
            }
            const targetChild = targetPathTree.children.filter(e => e.label == p + "/");
            if (targetChild.length > 0) {
                targetPathTree = targetChild[0]
            } else {
                break;
            }
        }
        return targetPathTree
    }
}