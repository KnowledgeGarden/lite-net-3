# Predicate Vocabulary Plugins
This directory defines a space in which new predicate vocabularies can be defined. The _climate_ vocabulary is a shell for now.

The _biomed_ vocabulary is currently being developed.

The particular vocabulary to be used is defined in the /config/config.json file.

Each vocabular directory contains two files:<br/>
* defns.json in which _topics_ are defined as JSON objects to be imported into the topic database.
* labels.json in which the labels for each predicate are made available to the _triple forms_ for selecting predicates.
