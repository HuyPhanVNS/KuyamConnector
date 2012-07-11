using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using InfoConn.Config;
using InfoConn.Core.Domain;
using InfoConn.Core.Common;
using System.Collections.Specialized;
using System.Web;

namespace InfoConn.Core.Authentication
{
    public class AuthenticationFacebook : AuthenticationBase
    {

        #region Properties
        readonly ISettingService _settingService = new SettingService();
        #endregion

        /// <summary>
        /// Authentication variables  
        /// </summary>        

        #region Authentication variables
        const string FacebookAuthorizeURLSettingKey = "InfoConn.Connector.Facebook.AuthorizeURL";
        const string FacebookAccessTokenURLSettingKey = "InfoConn.Connector.Facebook.AccessTokenURL";
        const string FacebookCallbackURLSettingKey = "InfoConn.Connector.Facebook.CallbackURL";
        const string FacebookAppIdSettingKey = "InfoConn.Connector.Facebook.ClientIdentifier";
        const string FacebookAppSecretSettingKey = "InfoConn.Connector.Facebook.ClientSecret";
        const string FacebookAppScopeSettingKey = "InfoConn.Connector.Facebook.Scope";

        #endregion

        #region Contructor
        public AuthenticationFacebook(ISettingService settingService)
        {
            this._settingService = settingService;
            this.ConsumerKey = _settingService.GetSetting(FacebookAppIdSettingKey);
            this.ConsumerSecret = _settingService.GetSetting(FacebookAppSecretSettingKey);
            this.AuthorizeURl = _settingService.GetSetting(FacebookAuthorizeURLSettingKey);
            this.AccessTokenURL = _settingService.GetSetting(FacebookAccessTokenURLSettingKey);
            this.CallbackURL = _settingService.GetSetting(FacebookCallbackURLSettingKey);
            this.Scope = _settingService.GetSetting(FacebookAppScopeSettingKey);
        }
        #endregion

        /// <summary>
        /// Authentication Properties
        /// </summary>
        #region Authentication Properties
        /// <summary>
        ///  Gets customerKey (it's applicationid) from config
        /// </summary>
        public override string ConsumerKey
        {
            get;
            set;
        }
        /// <summary>
        /// Gets customerSecret( it is application secret) from config
        /// </summary>
        public override string ConsumerSecret
        {
            get;
            set;
        }
        /// <summary>
        /// Token
        /// </summary>
        public override string Token
        {
            get;
            set;
        }
        /// <summary>
        /// Gets authorizeULR from config
        /// </summary>
        public override string AuthorizeURl
        {
            get;
            set;
        }
        /// <summary>
        /// Gets accessTokenURL
        /// </summary>
        public override string AccessTokenURL
        {
            get;
            set;
        }
        /// <summary>
        /// Gets callbackURL from config
        /// </summary>
        public override string CallbackURL
        {
            get;
            set;
        }

        /// <summary>
        /// Gets scope from config
        /// </summary>
        public override string Scope
        {
            get;
            set;
        }

        #endregion

        /// <summary>
        /// Authentication method
        /// </summary>        
        #region Authentication method
        /// <summary>
        /// Get the link to Facebook's authorization page for this application.
        /// </summary>
        /// <returns>The url with a valid request token, or a null string.</returns>
        public override string AuthorizationLinkGet()
        {
            return string.Format("{0}?client_id={1}&redirect_uri={2}&scope={3}", this.AuthorizeURl, this.ConsumerKey, this.CallbackURL, this.Scope);                     
        }
        /// <summary>
        /// Exchange the Facebook "code" for an access token.
        /// </summary>
        /// <param name="authToken">The oauth_token or "code" is supplied by Facebook's authorization page following the callback.</param>
        public override ConnectorSource AccessTokenGet(string authToken)
        {
            ConnectorSource authorization = new ConnectorSource();
            authorization.AccessToken = authToken;
            string accessTokenUrl = string.Format("{0}?client_id={1}&redirect_uri={2}&client_secret={3}&code={4}",
            this.AccessTokenURL, this.ConsumerKey, this.CallbackURL, this.ConsumerSecret, authToken);
            string response = CommonAuthentication.WebRequest(MethodType.GET, accessTokenUrl, String.Empty);
            if (response.Length > 0)
            {
                //Store the returned access_token
                NameValueCollection qs = HttpUtility.ParseQueryString(response);
                if (qs["access_token"] != null)
                {
                    authorization.AccessToken = qs["access_token"];
                }
                if (qs["expires"] != null)
                {
                    authorization.ExpiresDate = TimeZoneInfo.ConvertTimeToUtc(DateTime.Now.AddSeconds(double.Parse(qs["expires"])));
                }
            }
            return authorization;
        }
        /// <summary>
        /// Refresh existing access token
        /// </summary>
        /// <param name="existingAccessToken"></param>
        public override ConnectorSource RefreshAccessToken(String existingAccessToken)
        {
            ConnectorSource authorization = new ConnectorSource();
            authorization.AccessToken = existingAccessToken;
            string accessTokenUrl = string.Format("{0}?client_id={1}&redirect_uri={2}&client_secret={3}&grant_type=fb_exchange_token&fb_exchange_token={4}",
            this.AccessTokenURL, this.ConsumerKey, this.CallbackURL, this.ConsumerSecret, existingAccessToken);
            string response = CommonAuthentication.WebRequest(MethodType.GET, accessTokenUrl, String.Empty);
            if (response.Length > 0)
            {
                //Store the returned access_token
                NameValueCollection qs = HttpUtility.ParseQueryString(response);
                if (qs["access_token"] != null)
                {
                    authorization.AccessToken = qs["access_token"];
                }
                if (qs["expires"] != null)
                {
                    authorization.ExpiresDate = DateTime.Now.AddSeconds(double.Parse(qs["expires"]));
                }
            }
            return authorization;
        }
        #endregion
    }
}
