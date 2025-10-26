import type { SymbolMeta } from "../types";
import Graph from "graphology";

export function symbolsHtml(symbols: SymbolMeta[]) {
    const graph = new Graph();

    for (const node of symbols) {
        // Since deps property was removed with cache system, use default size
        graph.addNode(node.fqn, { label: node.name, size: 10, color: "gray" });
    }

    // Dependency edges are not available without cache system
    // Graph will only show nodes for now
}
