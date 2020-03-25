"use strict";

const topicDB = require('../topic_database');

class GraphModel {

  ////////////////////
  // NodeStruct and EdgeStruct construct JSON objects
  // for each topic and relation, to be used by vis.js
  ////////////////////

  nodeStruct(topicId, topiclabel) {
    var result = {};
    result.id = topicId;
    result.label = topiclabel;
    result.shape = "oval";
    result.mass = 2;
    //console.info('NODE', result);
    return result;
  }

  edgeStruct(fromId, toId) {
    var result = {};
    result.from = fromId;
    result.to = toId;
    result.arrows = 'to';
    //console.info('EDGE', result);
    return result;
  }

  ///////////////////////
  // We must construct sets, not bags of nodes and edges
  ///////////////////////
  nodeArrayContains(json, array) {
    var len = array.length,
        jo;
    for (var i = 0; i< len; i++) {
      jo = array[i];
      if (jo.id === json.id) {
        return true;
      }
    }
    return false;
  };

  edgeArrayContains(json, array) {
    var len = array.length,
        jo;
    for (var i = 0; i< len; i++) {
        jo = array[i];
        if ((jo.from === json.from) &&
            (jo.to === json.to) ||
            (jo.to === json.from) &&
            (jo.from === json.to)) {
            return true;
        }
    }
    return false;
  };
  /////////////////////////
  extractLabel(url) {
    var result = url;
    var where = result.indexOf('>'); // get first > from <a>
    where = result.indexOf('>', where); // get second >
    result = result.substring(where+1).trim();
    result = result.substring(0, (result.length - 4));
    //console.info('EXTRACT', url, result);
    return result;
  }

  /**
   * Fetch a graph for a given topic
   * Called from TopicModel getTopic after it fetches the topic
   * @param topic
   * @return
   */
  async fetchGraph(topic) {
    const topicId = topic.id;
    const topicLabel = topic.label;
    //Fetch this topics relations
    console.info('FetchGraph-1', topicId, topicLabel);
    const data = await topicDB.listRelations(topicId);
    console.info('FetchGraph-2', data);
    var result = {};
    var nodeListSet = [];
    var edgeListSet = [];
    //If any data, construct a graph from that
    if (data && data.length > 0) {
      var reln;
      var sourceId;
      var sourceLabel;
      var sourceUrl;
      var targetUrl;
      var targetId;
      var targetLabel;
      var relnType;
      var relnId;
      var node;
      var edge;
      for (var r in data) {
        reln = data[r];
        relnId = reln.id;
        relnType = reln.type;
        node = this.nodeStruct(relnId, relnType);
        if (!this.nodeArrayContains(node, nodeListSet)) {
          nodeListSet.push(node);
        }
        sourceId = reln.sourceId;
        targetId = reln.targetId;
        sourceUrl = reln.source;
        targetUrl = reln.target;
        sourceLabel = this.extractLabel(sourceUrl);
        targetLabel = this.extractLabel(targetUrl);
        node = this.nodeStruct(sourceId, sourceLabel);
        if (!this.nodeArrayContains(node, nodeListSet)) {
          nodeListSet.push(node);
        } 
        node = this.nodeStruct(targetId, targetLabel);
        if (!this.nodeArrayContains(node, nodeListSet)) {
          nodeListSet.push(node);
        }
        edge = this.edgeStruct(sourceId, relnId);
        if (!this.edgeArrayContains(edge, edgeListSet)) {
          edgeListSet.push(edge);
        }
        edge = this.edgeStruct(relnId, targetId);
        if (!this.edgeArrayContains(edge, edgeListSet)) {
          edgeListSet.push(edge);
        }
      }
    }
    result.nodes = nodeListSet;
    result.edges = edgeListSet;
    return result;
  };

}

const  instance = new GraphModel();
module.exports = instance;