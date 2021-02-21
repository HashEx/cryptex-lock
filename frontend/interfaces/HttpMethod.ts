/**
 * HTTP request methods.
 *
 * HTTP defines a set of request methods to indicate the desired action to be
 * performed for a given resource. Although they can also be nouns, these
 * request methods are sometimes referred as HTTP verbs. Each of them implements
 * a different semantic, but some common features are shared by a group of them:
 * e.g. a request method can be safe, idempotent, or cacheable.
 *
 * @public
 */
export enum HTTPMethod {
    CONNECT = 'CONNECT',
    DELETE = 'DELETE',
    GET = 'GET',
    HEAD = 'HEAD',
    OPTIONS = 'OPTIONS',
    PATCH = 'PATCH',
    POST = 'POST',
    PUT = 'PUT',
    TRACE = 'TRACE'
  }

  export default HTTPMethod