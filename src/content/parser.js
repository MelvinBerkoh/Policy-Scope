// We are going to be DOM walking, text block extraction and visibility filtering in this file. This is where we will be parsing the page and extracting the relevant information. 
// We will then pass this information to the detection module which will be responsible for running the detection algorithms on the parsed data.
// Just know that Its set up this way because Parsing != detecting. We want to be able to parse the page and then run detection on the parsed data. 
// This allows us to have a more modular and flexible architecture.