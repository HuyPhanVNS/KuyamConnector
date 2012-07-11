using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using InfoConn.Config;
using InfoConn.Core.Domain;

namespace InfoConn.Core.Authentication
{
    public abstract class AuthenticationBase
    {      

        #region Authentication Properties
        /// <summary>
        ///  Gets customerKey (it's applicationid) from config
        /// </summary>
        public abstract string ConsumerKey
        {
            get;
            set;
        }
        /// <summary>
        /// Gets customerSecret( it is application secret) from config
        /// </summary>
        public abstract string ConsumerSecret
        {
            get;
            set;
        }
        /// <summary>
        /// Token
        /// </summary>
        public abstract string Token
        {
            get;
            set;
        }
        /// <summary>
        /// Gets authorizeULR from config
        /// </summary>
        public abstract string AuthorizeURl
        {
            get;
            set;
        }
        /// <summary>
        /// Gets accessTokenURL
        /// </summary>
        public abstract string AccessTokenURL
        {
            get;
            set;
        }
        /// <summary>
        /// Gets callbackURL from config
        /// </summary>
        public abstract string CallbackURL
        {
            get;
            set;
        }
        public virtual string Scope
        {
            get;
            set;
        }
        #endregion        
               
        #region Authentication method
        /// <summary>
        /// Get the link to Facebook's authorization page for this application.
        /// </summary>
        /// <returns>The url with a valid request token, or a null string.</returns>
        public abstract string AuthorizationLinkGet();

        /// <summary>
        /// Exchange the Facebook "code" for an access token.
        /// </summary>
        /// <param name="authToken">The oauth_token or "code" is supplied by Facebook's authorization page following the callback.</param>
        public abstract ConnectorSource AccessTokenGet(string authToken);

        /// <summary>
        /// Refresh existing access token
        /// </summary>
        /// <param name="existingAccessToken"></param>
        public virtual ConnectorSource RefreshAccessToken(String existingAccessToken)
        {
            return new ConnectorSource();
        }


        #endregion
    }
}
