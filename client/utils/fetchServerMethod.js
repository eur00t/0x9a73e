export const fetchServerMethod = (url, method, body) => {
  return fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  }).then((response) => {
    if (response.status === 200) {
      return response.json();
    } else {
      return response.json().then((value) => {
        throw value;
      });
    }
  });
};
