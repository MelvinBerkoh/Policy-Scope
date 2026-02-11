// This will be where we will be defining the rules for the extension. This is where we will be defining the different types of clauses that we want to detect.
// This is going to be a simple file that will export an object that will contain the different rules that we want to use for our detections. 
// This will allow us to easily add new rules and modify existing rules without having to change the logic of the detection algorithms.

// Strong/weak keywords list will be defined here as well as the logic for how to use them in the detection algorithms.

// This will be the central source of truth makes the detections explainable and easy to grow in scope

/*Example : 
export const CLAUSES = {
  billing: {
    strong: [...],
    weak: [...],
    explanation: "..."
  }
}; */
