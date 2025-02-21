import Graph from "graphology";
import { SymbolMeta } from "src/ast";

export function symbolsHtml(symbols: SymbolMeta[]) {
    const graph = new Graph();

    for (const node of symbols) {
        graph.addNode(node.fqn, { label: node.name, size: node.deps.length > 5 ? 20 : 10, color: "gray"});
    }

    for (const node of symbols) {
        for (const dep of node.deps) {
            graph.addEdge(node.fqn, dep, { size: 5, color: "purple" })
        }
    }



}
