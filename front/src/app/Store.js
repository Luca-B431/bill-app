// Fonction qui récupère la réponse JSON d'une requête et lève une erreur si elle a échoué
const jsonOrThrowIfError = async (response) => {
  if (!response.ok) throw new Error((await response.json()).message); // Si la réponse n'est pas OK, on récupère et lève un message d'erreur
  return response.json(); // Sinon, on retourne le JSON de la réponse
};

// Classe permettant d'effectuer des requêtes HTTP vers une API
class Api {
  constructor({ baseUrl }) {
    this.baseUrl = baseUrl; // URL de base pour toutes les requêtes
  }

  // Méthode GET pour récupérer des données
  async get({ url, headers }) {
    return jsonOrThrowIfError(
      await fetch(`${this.baseUrl}${url}`, { headers, method: "GET" })
    );
  }

  // Méthode POST pour envoyer des données
  async post({ url, data, headers }) {
    return jsonOrThrowIfError(
      await fetch(`${this.baseUrl}${url}`, {
        headers,
        method: "POST",
        body: data,
      })
    );
  }

  // Méthode DELETE pour supprimer des données
  async delete({ url, headers }) {
    return jsonOrThrowIfError(
      await fetch(`${this.baseUrl}${url}`, { headers, method: "DELETE" })
    );
  }

  // Méthode PATCH pour modifier des données
  async patch({ url, data, headers }) {
    return jsonOrThrowIfError(
      await fetch(`${this.baseUrl}${url}`, {
        headers,
        method: "PATCH",
        body: data,
      })
    );
  }
}

// Fonction qui génère les en-têtes HTTP pour les requêtes API
const getHeaders = (headers) => {
  const h = {}; // Objet contenant les en-têtes de base

  // Ajoute l'en-tête Content-Type sauf si explicitement désactivé
  if (!headers.noContentType) h["Content-Type"] = "application/json";

  // Récupère le token JWT du localStorage et l'ajoute dans l'Authorization sauf si désactivé
  const jwt = localStorage.getItem("jwt");
  if (jwt && !headers.noAuthorization) h["Authorization"] = `Bearer ${jwt}`;

  // Fusionne les en-têtes de base avec ceux passés en argument
  return { ...h, ...headers };
};

// Classe représentant une ressource API spécifique (ex: "users", "bills")
class ApiEntity {
  constructor({ key, api }) {
    this.key = key; // Nom de la ressource (ex: "users", "bills")
    this.api = api; // Instance de la classe Api pour effectuer les requêtes
  }

  // Récupère un élément spécifique de la ressource (ex: GET /users/1)
  async select({ selector, headers = {} }) {
    return await this.api.get({
      url: `/${this.key}/${selector}`,
      headers: getHeaders(headers),
    });
  }

  // Liste tous les éléments de la ressource (ex: GET /users)
  async list({ headers = {} } = {}) {
    return await this.api.get({
      url: `/${this.key}`,
      headers: getHeaders(headers),
    });
  }

  // Met à jour un élément de la ressource (ex: PATCH /users/1)
  async update({ data, selector, headers = {} }) {
    return await this.api.patch({
      url: `/${this.key}/${selector}`,
      headers: getHeaders(headers),
      data,
    });
  }

  // Crée un nouvel élément dans la ressource (ex: POST /users)
  async create({ data, headers = {} }) {
    return await this.api.post({
      url: `/${this.key}`,
      headers: getHeaders(headers),
      data,
    });
  }

  // Supprime un élément de la ressource (ex: DELETE /users/1)
  async delete({ selector, headers = {} }) {
    return await this.api.delete({
      url: `/${this.key}/${selector}`,
      headers: getHeaders(headers),
    });
  }
}

// Classe qui centralise l'accès aux différentes ressources de l'API
class Store {
  constructor() {
    this.api = new Api({ baseUrl: "http://localhost:5678" }); // Définition de l'API avec l'URL de base
  }

  // Récupère un utilisateur spécifique par son ID (ex: store.user(1))
  user = (uid) =>
    new ApiEntity({ key: "users", api: this.api }).select({ selector: uid });

  // Récupère une instance de la ressource "users" pour effectuer des opérations (list, create, delete, etc.)
  users = () => new ApiEntity({ key: "users", api: this.api });

  // Effectue une requête de connexion à l'API (POST /auth/login)
  login = (data) =>
    this.api.post({
      url: "/auth/login",
      data,
      headers: getHeaders({ noAuthorization: true }),
    });

  // ?? Fonction non définie correctement (probablement une erreur)
  ref = (path) => this.store.doc(path);

  // Récupère une facture spécifique par son ID (ex: store.bill(5))
  bill = (bid) =>
    new ApiEntity({ key: "bills", api: this.api }).select({ selector: bid });

  // Récupère une instance de la ressource "bills" pour effectuer des opérations (list, create, delete, etc.)
  bills = () => new ApiEntity({ key: "bills", api: this.api });
}

// Exporte une instance unique de la classe Store, pour l'utiliser dans l'application
export default new Store();
