# lite-net
Simple triple journal

Just:
* npm install
* npm start
* visit http://localhost:4000/


To clean the databases, just delete the two files in the /data folder.

## UX
On the Journal landing page, there are three methods by which new journal entries are crafted:
* Entering a URL for harvesting
* Entering a text note
* Creating a triple

### Entering a URL for harvesting
Past a URL in the box and click Submit.
A new page will be presented with the content of the selected URL visible, together with two modes of journal fabrication: a text note and a triple.

This allows for harvesting information from the selected resource.
### Entering a text note
A text note can be any text desired, including copying and pasting from other sources. This is not (yet) a _rich text_ feature.
In any text entered, it is possible to create _Wikilinks_ by surrounding a word or phrase with "[[ ... ]]".
### Creating a triple
A triple consists of three components to form a statement like _something causes something else_, which has the form {subject, predicate, object}. Type the subject word or phrase into its box, and do the same for the predicate and the object. There is an opportunity to add a URL and a comment. 
