async function run() {
  console.log("Testing endpoints...");
  try {
    const responses = await Promise.all([
      fetch('http://localhost:3002/api/v1/cuisine'),
      fetch('http://localhost:3002/api/v1/custom'),
      fetch('http://localhost:3002/api/v1/folk-art'),
      fetch('http://localhost:3002/api/v1/cuisine/1')
    ]);

    for (let i = 0; i < responses.length; i++) {
      const res = responses[i];
      const url = res.url;
      console.log(`\nURL: ${url}`);
      console.log(`Status: ${res.status} ${res.statusText}`);
      if (res.ok) {
        const json = await res.json();
        if (url.includes('/cuisine/1')) {
          console.log(`Detail Data for Cuisine ID 1:`, JSON.stringify(json.data, null, 2));
        } else {
          console.log(`Data count: ${json.data ? json.data.length : 'no data list'}`);
        }
      } else {
        const text = await res.text();
        console.error(`Error:`, text);
      }
    }
  } catch (err) {
    console.error("Test failed with error:", err);
  }
  process.exit(0);
}

run();
