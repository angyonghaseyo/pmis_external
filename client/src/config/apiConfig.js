const getBaseUrl = () => {
    if (process.env.NODE_ENV === 'production') {
      return 'http://54.179.23.145:5001'; 
    }
    return 'http://localhost:5001';
  };
  
  export const API_URL = getBaseUrl();