using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using InfoConn.Core.Domain.DTO;
using InfoConn.Core.Domain;

namespace InfoConn.Core
{
    public interface IConnectorManager
    {
        /// <summary>
        /// Get connector by soure type
        /// </summary>
        /// <param name="sourceType"></param>
        /// <returns></returns>
        ConnectorBase GetConnector(ConnectorSourceType sourceType);

        /// <summary>
        /// Get connector by connector source
        /// </summary>
        /// <param name="connectorSource"></param>
        /// <returns></returns>
        ConnectorBase GetConnector(ConnectorSource connectorSource);     
    }
}
