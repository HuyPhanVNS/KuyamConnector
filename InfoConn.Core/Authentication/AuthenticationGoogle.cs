using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using InfoConn.Core.Domain;
using InfoConn.Core.Common;
using System.Web.Script.Serialization;
using InfoConn.Config;

namespace InfoConn.Core.Authentication
{
    public class AuthenticationGoogle : AuthenticationBase
    {
        #region Properties
        readonly ISettingService _settingService = new SettingService();
        #endregion

        /// <summary>
        /// Authentication variables
        /// </summary>
        #region Authentication variables
        const string GoogleClientIdentifierSettingKey = "InfoConn.Connector.Google.ClientIdentifier";
        const string GoogleClientSecretSettingKey = "InfoConn.Connector.Google.ClientSecret";
        const string GoogleClientAuthorizeURLSettingKey = "InfoConn.Connector.Google.AuthorizeURL";
        const string GoogleClientAccessTokenURLSettingKey = "InfoConn.Connector.Google.AccessTokenURL";
        const string GoogleClientCallbackURLSettingKey = "InfoConn.Connector.Google.CallbackURL";
        const string GoogleClientScopeURLSettingKey = "InfoConn.Connector.Google.Scope";
        #endregion

        #region Contructor
        public AuthenticationGoogle(ISettingService _settingService)
        {
            this.ConsumerKey = _settingService.GetSetting(GoogleClientIdentifierSettingKey);
            this.ConsumerSecret = _settingService.GetSetting(GoogleClientSecretSettingKey);
            this.AuthorizeURl = _settingService.GetSetting(GoogleClientAuthorizeURLSettingKey);
            this.AccessTokenURL = _settingService.GetSetting(GoogleClientAccessTokenURLSettingKey);
            this.CallbackURL = _settingService.GetSetting(GoogleClientCallbackURLSettingKey);
            this.Scope = _settingService.GetSetting(GoogleClientScopeURLSettingKey);
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

        #region Authentication method
        /// <summary>
        /// Get the link to google's authorization page for this application.
        /// </summary>
        /// <returns>The url with a valid request token, or a null string.</returns>
        public override string AuthorizationLinkGet()
        {
            return string.Format("{0}?client_id={1}&redirect_uri={2}&scope={3}&state=profile&response_type=code&access_type=offline&approval_prompt=force", this.AuthorizeURl, this.ConsumerKey, this.CallbackURL, this.Scope);
        }
        /// <summary>
        /// Exchange the google "code" for an access token.
        /// </summary>
        /// <param name="authToken">The oauth_token or "code" is supplied by google's authorization page following the callback.</param>
        public override ConnectorSource AccessTokenGet(string authToken)
        {
            ConnectorSource authorization = new ConnectorSource();
            authorization.AccessToken = authToken;
            string postData = string.Format("code={0}&client_id={1}&client_secret={2}&redirect_uri={3}&grant_type=authorization_code",
             authToken, this.ConsumerKey, this.ConsumerSecret, this.CallbackURL);
            string response = CommonAuthentication.WebRequest(MethodType.POST, this.AccessTokenURL, postData);
            if (response.Length > 0)
            {
                JavaScriptSerializer javascriptSerializer = new JavaScriptSerializer();
                javascriptSerializer.RegisterConverters(new JavaScriptConverter[] { new DynamicJsonConverter() });
                dynamic authenticationEntry = javascriptSerializer.Deserialize(response, typeof(object)) as dynamic;
                authorization.AccessToken = authenticationEntry.access_token;
                authorization.RefressToken = authenticationEntry.refresh_token;
                authorization.ExpiresDate = DateTime.Now.AddSeconds(authenticationEntry.expires_in);

            }
            return authorization;
        }
        #endregion

    }
}
