
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
    });

    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.map((item: any) => ({
      ...item,
      id: item._id || item.id,
    }));
  },

  async get(collection: string, id: string) {
    const res = await fetch(`/api/mongodb/${collection}/${id}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    if (!data) return null;
    return { ...data, id: data._id || data.id };
  },

  async create(collection: string, data: any) {
    const res = await fetch(`/api/mongodb/${collection}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  async update(collection: string, id: string, data: any) {
    const res = await fetch(`/api/mongodb/${collection}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  async delete(collection: string, id: string) {
    const res = await fetch(`/api/mongodb/${collection}/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  }
};
