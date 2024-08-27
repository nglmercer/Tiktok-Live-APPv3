import { socketurl } from './socket';
function getformdatabyid(form,split='_') {
  const formData = {};
  const elements = form.elements;

  for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      if (element.type !== 'submit' && element.type !== 'button') {
          const nameParts = element.id.split(split);
          if (nameParts.length > 1 && nameParts[1] === 'check') {
              const baseName = nameParts[0];
              formData[baseName] = formData[baseName] || {};
              formData[baseName]['check'] = element.checked;
          } else {
              if (element.type === 'checkbox') {
                  formData[element.id] = element.checked;
              } else {
                  if (formData[element.id] && typeof formData[element.id] === 'object') {
                      formData[element.id]['value'] = element.value;
                  } else {
                      formData[element.id] = element.value;
                  }
              }
          }
      }
  }

  return formData;
}
async function postToFileHandler(event, params, serverurl) {
  const data = { event, ...params };
  const defaultServerUrl = serverurl || `${socketurl.getport()}/file-handler`;
  const response = await getdatafromserver(defaultServerUrl, data);
  return response;
}
async function getdatafromserver(serverurl,data) {
  const response = await fetch(`${serverurl}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (response) {
    return response.json();
  } else {
    return { success: false, error: 'No response from server' };
  }
}
export { getformdatabyid, postToFileHandler, getdatafromserver };
