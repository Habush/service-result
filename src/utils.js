export const AnalysisStatus = {
  ACTIVE: 1,
  COMPLETED: 2,
  ERROR: -1
};

export const FilterFor = { Overfitness: 1, Score: 2 };

export const SERVER_ADDRESS = process.env.SERVICE_ADDR
  ? process.env.SERVICE_ADDR
  : "http://localhost:5000";

export const getQueryValue = variable => {
  const vars = window.location.search.substring(1).split("&");
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    if (pair[0] == variable) {
      return pair[1];
    }
  }
  return null;
};

export const fetchAnalysisStatus = id => {
  return fetch(`${SERVER_ADDRESS}/status/${id}`).then(response =>
    response.json()
  );
};

export const filterResult = (id, filter, value, filterFor) => {
  console.log("filterFor", filterFor);
  return fetch(
    `${SERVER_ADDRESS}/filter/${
      filterFor === FilterFor.Overfitness ? "overfitness" : "score"
    }/${id}?filter=${filter}&value=${value}`
  ).then(response => {
    response.json();
  });
};

export const downloadFilteredResult = id => {
  window.open(`${SERVER_ADDRESS}/filter/${id}/download`, "_blank");
};
