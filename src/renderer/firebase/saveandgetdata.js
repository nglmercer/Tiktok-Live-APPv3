async function saveObjectToFirestore(object) {
  try {
      // Convertir el objeto a una cadena JSON
      const jsonString = JSON.stringify(object);

      // Crear el documento con el campo 'datajson' conteniendo la cadena JSON
      const docRef = await addDoc(collection(db, "datajson"), {
          datajson: jsonString
      });

      console.log("Document written with ID: ", docRef.id);
  } catch (e) {
      console.error("Error adding document: ", e);
  }
}

// Ejemplo de uso
const newObject = {
  name: "Example",
  description: "This is an example object",
  createdAt: new Date()
};

saveObjectToFirestore(newObject);
