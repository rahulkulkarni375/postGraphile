const pool = require('./db');
const { PubSub } = require('graphql-subscriptions');

const pubsub = new PubSub();

const resolvers = {
  Query: {
    getStudents: async () => {
      const res = await pool.query('SELECT * FROM students');
      return res.rows;
    },
    getStudentById: async (_, { id }) => {
      const res = await pool.query('SELECT * FROM students WHERE id = $1', [id]);
      return res.rows[0];
    }
  },
  Mutation: {
    addStudent: async (_, { name, phone_number }) => {
      const res = await pool.query(
        'INSERT INTO students(name, phone_number) VALUES($1, $2) RETURNING *',
        [name, phone_number]
      );
      const newStudent = res.rows[0];
      pubsub.publish('STUDENT_ADDED', { studentAdded: newStudent });
      return newStudent;
    },
    updateStudent: async (_, { id, name, phone_number }) => {
      // First check if the student exists
      const checkRes = await pool.query('SELECT * FROM students WHERE id = $1', [id]);
      if (checkRes.rows.length === 0) {
        throw new Error(`Student with ID ${id} not found`);
      }

      // Build the update query dynamically based on which fields are provided
      let updateQuery = 'UPDATE students SET ';
      const updateValues = [];
      const updateFields = [];
      
      if (name !== undefined) {
        updateFields.push(`name = $${updateFields.length + 1}`);
        updateValues.push(name);
      }
      
      if (phone_number !== undefined) {
        updateFields.push(`phone_number = $${updateFields.length + 1}`);
        updateValues.push(phone_number);
      }
      
      // If no fields to update, return the existing student
      if (updateFields.length === 0) {
        return checkRes.rows[0];
      }
      
      updateQuery += updateFields.join(', ');
      updateQuery += ` WHERE id = $${updateFields.length + 1} RETURNING *`;
      updateValues.push(id);
      
      // Execute the update
      const res = await pool.query(updateQuery, updateValues);
      const updatedStudent = res.rows[0];
      
      pubsub.publish('STUDENT_UPDATED', { studentUpdated: updatedStudent });
      return updatedStudent;
    },
    deleteStudent: async (_, { id }) => {
      // First check if the student exists
      const checkRes = await pool.query('SELECT * FROM students WHERE id = $1', [id]);
      if (checkRes.rows.length === 0) {
        return {
          success: false,
          message: `Student with ID ${id} not found`,
          id: id
        };
      }

      // Delete the student
      await pool.query('DELETE FROM students WHERE id = $1', [id]);
      
      pubsub.publish('STUDENT_DELETED', { studentDeleted: id });
      
      return {
        success: true,
        message: `Student with ID ${id} deleted successfully`,
        id: id
      };
    }
  },
  Subscription: {
    studentAdded: {
      subscribe: () => pubsub.asyncIterator(['STUDENT_ADDED']),
    },
    studentUpdated: {
      subscribe: () => pubsub.asyncIterator(['STUDENT_UPDATED']),
    },
    studentDeleted: {
      subscribe: () => pubsub.asyncIterator(['STUDENT_DELETED']),
    }
  },
};

module.exports = { resolvers, pubsub };