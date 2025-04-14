import { useState, useEffect } from "react";
import { ApolloClient, InMemoryCache, ApolloProvider, useQuery, useMutation, gql } from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { split, HttpLink } from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";

// GraphQL queries and mutations
const GET_STUDENTS = gql`
  query GetStudents {
    getStudents {
      id
      name
      phone_number
    }
  }
`;

const ADD_STUDENT = gql`
  mutation AddStudent($name: String!, $phone_number: String!) {
    addStudent(name: $name, phone_number: $phone_number) {
      id
      name
      phone_number
    }
  }
`;

const UPDATE_STUDENT = gql`
  mutation UpdateStudent($id: ID!, $name: String, $phone_number: String) {
    updateStudent(id: $id, name: $name, phone_number: $phone_number) {
      id
      name
      phone_number
    }
  }
`;

const DELETE_STUDENT = gql`
  mutation DeleteStudent($id: ID!) {
    deleteStudent(id: $id) {
      success
      message
      id
    }
  }
`;

const STUDENT_ADDED_SUBSCRIPTION = gql`
  subscription OnStudentAdded {
    studentAdded {
      id
      name
      phone_number
    }
  }
`;

const STUDENT_UPDATED_SUBSCRIPTION = gql`
  subscription OnStudentUpdated {
    studentUpdated {
      id
      name
      phone_number
    }
  }
`;

const STUDENT_DELETED_SUBSCRIPTION = gql`
  subscription OnStudentDeleted {
    studentDeleted
  }
`;

// Create an HTTP link for queries and mutations
const httpLink = new HttpLink({ uri: "http://localhost:4000/graphql" });

// Create a WebSocket link for subscriptions
const wsLink = new GraphQLWsLink(createClient({ url: "ws://localhost:4000/graphql" }));

// Split links based on operation type
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === "OperationDefinition" && definition.operation === "subscription";
  },
  wsLink,
  httpLink
);

// Create Apollo Client
const client = new ApolloClient({ link: splitLink, cache: new InMemoryCache() });

// StudentList component
function StudentList() {
  const { loading, error, data, subscribeToMore, refetch } = useQuery(GET_STUDENTS);
  const [addStudent] = useMutation(ADD_STUDENT);
  const [updateStudent] = useMutation(UPDATE_STUDENT);
  const [deleteStudent] = useMutation(DELETE_STUDENT);

  const [newStudent, setNewStudent] = useState({ name: "", phone_number: "" });
  const [editingStudent, setEditingStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Subscribe to student events
  useEffect(() => {
    const studentAddedSubscription = subscribeToMore({
      document: STUDENT_ADDED_SUBSCRIPTION,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;

        const newStudent = subscriptionData.data.studentAdded;
        // Ensure the student isn't already in the list
        const exists = prev.getStudents.some((s) => s.id === newStudent.id);
        if (!exists) {
          return { getStudents: [...prev.getStudents, newStudent] };
        }
        return prev;
      },
    });

    const studentUpdatedSubscription = subscribeToMore({
      document: STUDENT_UPDATED_SUBSCRIPTION,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;

        const updatedStudent = subscriptionData.data.studentUpdated;
        return {
          getStudents: prev.getStudents.map((student) => (student.id === updatedStudent.id ? updatedStudent : student)),
        };
      },
    });

    const studentDeletedSubscription = subscribeToMore({
      document: STUDENT_DELETED_SUBSCRIPTION,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;

        const deletedStudentId = subscriptionData.data.studentDeleted;
        return {
          getStudents: prev.getStudents.filter((student) => student.id !== deletedStudentId),
        };
      },
    });

    // Set interval to refetch data every 5 seconds
    const intervalId = setInterval(() => {
      console.log("Refetching data every 5 seconds");
      refetch(); // Call refetch to reload the data
    }, 5000);

    // Clean up subscription and interval
    return () => {
      studentAddedSubscription();
      studentUpdatedSubscription();
      studentDeletedSubscription();
      clearInterval(intervalId);
    };
  }, [subscribeToMore, refetch]);

  // Handle input changes for the new student form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (isEditing) {
      setEditingStudent((prev) => ({ ...prev, [name]: value }));
    } else {
      setNewStudent((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle the form submit to add a new student
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        // Update existing student
        await updateStudent({
          variables: {
            id: editingStudent.id,
            name: editingStudent.name,
            phone_number: editingStudent.phone_number,
          },
        });
        setIsEditing(false);
        setEditingStudent(null);
      } else {
        // Add new student
        await addStudent({ variables: newStudent });
        setNewStudent({ name: "", phone_number: "" }); // Clear the form after submission
      }
    } catch (err) {
      console.error("Error with student operation:", err);
    }
  };

  // Handle edit button click
  const handleEdit = (student) => {
    setEditingStudent(student);
    setIsEditing(true);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingStudent(null);
  };

  // Handle delete student
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        await deleteStudent({ variables: { id } });
      } catch (err) {
        console.error("Error deleting student:", err);
      }
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="container">
      <h2>{isEditing ? "Edit Student" : "Add New Student"}</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Name:</label>
          <input type="text" name="name" value={isEditing ? editingStudent.name : newStudent.name} onChange={handleInputChange} required />
        </div>
        <div className="form-group">
          <label>Phone Number:</label>
          <input
            type="text"
            name="phone_number"
            value={isEditing ? editingStudent.phone_number : newStudent.phone_number}
            onChange={handleInputChange}
            required
          />
        </div>
        <button type="submit" className="btn">
          {isEditing ? "Update Student" : "Add Student"}
        </button>
        {isEditing && (
          <button type="button" className="btn" onClick={handleCancelEdit} style={{ marginLeft: "10px" }}>
            Cancel
          </button>
        )}
      </form>

      <h2>Students List</h2>
      {data.getStudents.length === 0 ? (
        <p>No students found</p>
      ) : (
        <table className="student-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Phone Number</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.getStudents.map((student) => (
              <tr key={student.id}>
                <td>{student.id}</td>
                <td>{student.name}</td>
                <td>{student.phone_number}</td>
                <td>
                  <button
                    onClick={() => handleEdit(student)}
                    style={{ marginRight: "5px", background: "#4caf50", color: "white", border: "none", padding: "5px 10px", cursor: "pointer" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(student.id)}
                    style={{ background: "#f44336", color: "white", border: "none", padding: "5px 10px", cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function App() {
  return (
    <ApolloProvider client={client}>
      <div className="app">
        <header>
          <h1>Student Management System with polling</h1>
        </header>
        <main>
          <StudentList />
        </main>
      </div>
    </ApolloProvider>
  );
}

export default App;



// import { useState, useEffect } from "react";
// import { ApolloClient, InMemoryCache, ApolloProvider, useQuery, useMutation, gql } from "@apollo/client";
// import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
// import { createClient } from "graphql-ws";
// import { split, HttpLink } from "@apollo/client";
// import { getMainDefinition } from "@apollo/client/utilities";

// // GraphQL queries and mutations
// const GET_STUDENTS = gql`
//   query GetStudents {
//     getStudents {
//       id
//       name
//       phone_number
//     }
//   }
// `;

// const ADD_STUDENT = gql`
//   mutation AddStudent($name: String!, $phone_number: String!) {
//     addStudent(name: $name, phone_number: $phone_number) {
//       id
//       name
//       phone_number
//     }
//   }
// `;

// const UPDATE_STUDENT = gql`
//   mutation UpdateStudent($id: ID!, $name: String, $phone_number: String) {
//     updateStudent(id: $id, name: $name, phone_number: $phone_number) {
//       id
//       name
//       phone_number
//     }
//   }
// `;

// const DELETE_STUDENT = gql`
//   mutation DeleteStudent($id: ID!) {
//     deleteStudent(id: $id) {
//       success
//       message
//       id
//     }
//   }
// `;

// const STUDENT_ADDED_SUBSCRIPTION = gql`
//   subscription OnStudentAdded {
//     studentAdded {
//       id
//       name
//       phone_number
//     }
//   }
// `;

// const STUDENT_UPDATED_SUBSCRIPTION = gql`
//   subscription OnStudentUpdated {
//     studentUpdated {
//       id
//       name
//       phone_number
//     }
//   }
// `;

// const STUDENT_DELETED_SUBSCRIPTION = gql`
//   subscription OnStudentDeleted {
//     studentDeleted
//   }
// `;

// // Create an HTTP link for queries and mutations
// const httpLink = new HttpLink({ uri: "http://localhost:4000/graphql" });

// // Create a WebSocket link for subscriptions with explicit protocols and reconnection
// const wsLink = new GraphQLWsLink(
//   createClient({
//     url: "ws://localhost:4000/graphql",
//     connectionParams: {
//       // Add any auth tokens if needed
//     },
//     shouldRetry: true,
//     retryAttempts: 5,
//   })
// );

// // Split links based on operation type
// const splitLink = split(
//   ({ query }) => {
//     const definition = getMainDefinition(query);
//     return definition.kind === "OperationDefinition" && definition.operation === "subscription";
//   },
//   wsLink,
//   httpLink
// );

// // Create Apollo Client with optimized cache
// const client = new ApolloClient({
//   link: splitLink,
//   cache: new InMemoryCache({
//     typePolicies: {
//       Query: {
//         fields: {
//           getStudents: {
//             merge(existing = [], incoming) {
//               return incoming;
//             },
//           },
//         },
//       },
//     },
//   }),
// });

// // StudentList component
// function StudentList() {
//   const { loading, error, data, refetch } = useQuery(GET_STUDENTS);
//   const [addStudent] = useMutation(ADD_STUDENT, {
//     update(cache, { data: { addStudent } }) {
//       const { getStudents } = cache.readQuery({ query: GET_STUDENTS });
//       cache.writeQuery({
//         query: GET_STUDENTS,
//         data: { getStudents: [...getStudents, addStudent] },
//       });
//     },
//   });
  
//   const [updateStudent] = useMutation(UPDATE_STUDENT, {
//     update(cache, { data: { updateStudent } }) {
//       const { getStudents } = cache.readQuery({ query: GET_STUDENTS });
//       cache.writeQuery({
//         query: GET_STUDENTS,
//         data: { 
//           getStudents: getStudents.map(student => 
//             student.id === updateStudent.id ? updateStudent : student
//           ),
//         },
//       });
//     },
//   });
  
//   const [deleteStudent] = useMutation(DELETE_STUDENT, {
//     update(cache, { data: { deleteStudent } }) {
//       const { getStudents } = cache.readQuery({ query: GET_STUDENTS });
//       cache.writeQuery({
//         query: GET_STUDENTS,
//         data: { 
//           getStudents: getStudents.filter(student => student.id !== deleteStudent.id),
//         },
//       });
//     },
//   });

//   const [newStudent, setNewStudent] = useState({ name: "", phone_number: "" });
//   const [editingStudent, setEditingStudent] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [subscriptionStatus, setSubscriptionStatus] = useState({
//     add: false,
//     update: false,
//     delete: false,
//   });

//   // Set up subscriptions
//   useEffect(() => {
//     console.log("Setting up subscriptions...");
    
//     // Student Added Subscription
//     const addedSubscription = client.subscribe({
//       query: STUDENT_ADDED_SUBSCRIPTION,
//     }).subscribe({
//       next({ data }) {
//         console.log("Student added data received:", data);
//         setSubscriptionStatus(prev => ({ ...prev, add: true }));
//         if (data && data.studentAdded) {
//           refetch();
//         }
//       },
//       error(err) {
//         console.error("Error in student added subscription:", err);
//         setSubscriptionStatus(prev => ({ ...prev, add: false }));
//       },
//     });

//     // Student Updated Subscription
//     const updatedSubscription = client.subscribe({
//       query: STUDENT_UPDATED_SUBSCRIPTION,
//     }).subscribe({
//       next({ data }) {
//         console.log("Student updated data received:", data);
//         setSubscriptionStatus(prev => ({ ...prev, update: true }));
//         if (data && data.studentUpdated) {
//           refetch();
//         }
//       },
//       error(err) {
//         console.error("Error in student updated subscription:", err);
//         setSubscriptionStatus(prev => ({ ...prev, update: false }));
//       },
//     });

//     // Student Deleted Subscription
//     const deletedSubscription = client.subscribe({
//       query: STUDENT_DELETED_SUBSCRIPTION,
//     }).subscribe({
//       next({ data }) {
//         console.log("Student deleted data received:", data);
//         setSubscriptionStatus(prev => ({ ...prev, delete: true }));
//         if (data && data.studentDeleted) {
//           refetch();
//         }
//       },
//       error(err) {
//         console.error("Error in student deleted subscription:", err);
//         setSubscriptionStatus(prev => ({ ...prev, delete: false }));
//       },
//     });

//     // Cleanup subscriptions on unmount
//     return () => {
//       console.log("Cleaning up subscriptions");
//       addedSubscription.unsubscribe();
//       updatedSubscription.unsubscribe();
//       deletedSubscription.unsubscribe();
//     };
//   }, [refetch]);

//   // Handle input changes for the new student form
//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     if (isEditing) {
//       setEditingStudent((prev) => ({ ...prev, [name]: value }));
//     } else {
//       setNewStudent((prev) => ({ ...prev, [name]: value }));
//     }
//   };

//   // Handle the form submit to add a new student
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       if (isEditing) {
//         // Update existing student
//         await updateStudent({
//           variables: {
//             id: editingStudent.id,
//             name: editingStudent.name,
//             phone_number: editingStudent.phone_number,
//           },
//         });
//         setIsEditing(false);
//         setEditingStudent(null);
//       } else {
//         // Add new student
//         await addStudent({ variables: newStudent });
//         setNewStudent({ name: "", phone_number: "" }); // Clear the form after submission
//       }
//     } catch (err) {
//       console.error("Error with student operation:", err);
//       alert(`Operation failed: ${err.message}`);
//     }
//   };

//   // Handle edit button click
//   const handleEdit = (student) => {
//     setEditingStudent(student);
//     setIsEditing(true);
//   };

//   // Handle cancel edit
//   const handleCancelEdit = () => {
//     setIsEditing(false);
//     setEditingStudent(null);
//   };

//   // Handle delete student
//   const handleDelete = async (id) => {
//     if (window.confirm("Are you sure you want to delete this student?")) {
//       try {
//         await deleteStudent({ variables: { id } });
//       } catch (err) {
//         console.error("Error deleting student:", err);
//         alert(`Delete failed: ${err.message}`);
//       }
//     }
//   };

//   // Force refresh of data
//   const handleRefresh = () => {
//     refetch();
//   };

//   if (loading) return <p>Loading...</p>;
//   if (error) return <p>Error: {error.message}</p>;

//   return (
//     <div className="container">
//       <h2>{isEditing ? "Edit Student" : "Add New Student"}</h2>
//       <form onSubmit={handleSubmit} className="form">
//         <div className="form-group">
//           <label>Name:</label>
//           <input type="text" name="name" value={isEditing ? editingStudent.name : newStudent.name} onChange={handleInputChange} required />
//         </div>
//         <div className="form-group">
//           <label>Phone Number:</label>
//           <input
//             type="text"
//             name="phone_number"
//             value={isEditing ? editingStudent.phone_number : newStudent.phone_number}
//             onChange={handleInputChange}
//             required
//           />
//         </div>
//         <button type="submit" className="btn">
//           {isEditing ? "Update Student" : "Add Student"}
//         </button>
//         {isEditing && (
//           <button type="button" className="btn" onClick={handleCancelEdit} style={{ marginLeft: "10px" }}>
//             Cancel
//           </button>
//         )}
//       </form>

//       <h2>Students List</h2>
//       {data.getStudents.length === 0 ? (
//         <p>No students found</p>
//       ) : (
//         <table className="student-table">
//           <thead>
//             <tr>
//               <th>ID</th>
//               <th>Name</th>
//               <th>Phone Number</th>
//               <th>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {data.getStudents.map((student) => (
//               <tr key={student.id}>
//                 <td>{student.id}</td>
//                 <td>{student.name}</td>
//                 <td>{student.phone_number}</td>
//                 <td>
//                   <button
//                     onClick={() => handleEdit(student)}
//                     style={{ marginRight: "5px", background: "#4caf50", color: "white", border: "none", padding: "5px 10px", cursor: "pointer" }}
//                   >
//                     Edit
//                   </button>
//                   <button
//                     onClick={() => handleDelete(student.id)}
//                     style={{ background: "#f44336", color: "white", border: "none", padding: "5px 10px", cursor: "pointer" }}
//                   >
//                     Delete
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}
//     </div>
//   );
// }

// function App() {
//   return (
//     <ApolloProvider client={client}>
//       <div className="app">
//         <header>
//           <h1>Student Management System without polling</h1>
//         </header>
//         <main>
//           <StudentList />
//         </main>
//       </div>
//     </ApolloProvider>
//   );
// }

// export default App;