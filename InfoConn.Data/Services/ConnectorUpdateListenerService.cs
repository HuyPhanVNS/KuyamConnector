using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using InfoConn.Data;
using InfoConn.Core;
using InfoConn.Data.Respositories;

namespace InfoConn.Data.Services
{
    public class ConnectorUpdateListenerService:IConnectorUpdateListenerService
    {
        public IConnectorUpdateListenerRepository _connectorUpdateListenerRepository { get; set; }

        public ConnectorUpdateListenerService(IConnectorUpdateListenerRepository ConnectorUpdateListenerRepository)
        {
            this._connectorUpdateListenerRepository = ConnectorUpdateListenerRepository;
        }
    }
}
