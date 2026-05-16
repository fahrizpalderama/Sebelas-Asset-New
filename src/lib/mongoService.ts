
export const mongoService = {
  async list(collection: string, constraints: any[] = []) {
    let url = `/api/mongodb/${collection}`;
    const params = new URLSearchParams();
    
    constraints.forEach(c => {
      if (c.type === 'orderBy') {
        params.append('orderBy', c.args[0]);
        if (c.args[1]) params.append('orderDir', c.args[1]);
      }
      if (c.type === 'limit') {
        params.append('limit', c.n.toString());
      }
      if (c.type === 'search') {
        params.append('search', c.args[0]);
      }
      if (c.type === 'where') {
        // args: [field, operator, value]
        params.append('where', JSON.stringify({
          field: c.args[0],
          operator: c.args[1],
          value: c.args[2]
        }));
      }
    });

    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    let res;
    try {
      res = await fetch(url);
    } catch (e: any) {
      console.error(`Fetch encountered network error for ${url}:`, e);
      throw new Error(`Connection failed: ${e.message}. The server might be offline or starting up.`);
    }

    const contentType = res.headers.get("content-type");
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error("Expected JSON but got:", text.substring(0, 100));
      throw new Error(`Server returned non-JSON response (likely HTML). Check API routing. Response started with: ${text.substring(0, 50)}...`);
    }
    const data = await res.json();
    return data.map((item: any) => ({
      ...item,
      id: item._id || item.id,
    }));
  },

  async get(collection: string, id: string) {
    const url = `/api/mongodb/${collection}/${id}`;
    let res;
    try {
      res = await fetch(url);
    } catch (e: any) {
      console.error(`Fetch GET network error for ${url}:`, e);
      throw new Error(`Connection failed: ${e.message}`);
    }
    const contentType = res.headers.get("content-type");
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error("Expected JSON but got:", text.substring(0, 100));
      throw new Error(`Server returned non-JSON response. Response started with: ${text.substring(0, 50)}...`);
    }
    const data = await res.json();
    if (!data) return null;
    return { ...data, id: data._id || data.id };
  },

  async create(collection: string, data: any) {
    const url = `/api/mongodb/${collection}`;
    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (e: any) {
      console.error(`Fetch POST network error for ${url}:`, e);
      throw new Error(`Connection failed: ${e.message}`);
    }
    const contentType = res.headers.get("content-type");
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned non-JSON response for POST");
    }
    return await res.json();
  },

  async update(collection: string, id: string, data: any) {
    const url = `/api/mongodb/${collection}/${id}`;
    let res;
    try {
      res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (e: any) {
      console.error(`Fetch PUT network error for ${url}:`, e);
      throw new Error(`Connection failed: ${e.message}`);
    }
    const contentType = res.headers.get("content-type");
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned non-JSON response for PUT");
    }
    return await res.json();
  },

  async delete(collection: string, id: string) {
    const url = `/api/mongodb/${collection}/${id}`;
    let res;
    try {
      res = await fetch(url, {
        method: "DELETE",
      });
    } catch (e: any) {
      console.error(`Fetch DELETE network error for ${url}:`, e);
      throw new Error(`Connection failed: ${e.message}`);
    }
    const contentType = res.headers.get("content-type");
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned non-JSON response for DELETE");
    }
    return await res.json();
  }
};
