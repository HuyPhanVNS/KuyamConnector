using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Castle.Windsor;
using Castle.MicroKernel.Registration;
using InfoConn.Config;

namespace InfoConn.Services
{
    public static class IoC
    {
        static WindsorContainer _container;
        static IoC()
        {
            _container = new WindsorContainer();
        }

        /// <summary>
        /// Register dependency
        /// </summary>
        /// <param name="registrations"></param>
        /// <returns></returns>
        public static IWindsorContainer Register(params IRegistration[] registrations)           
        {
            return _container.Register(registrations);
        }

        /// <summary>
        /// Resolve a T Type
        /// </summary>
        /// <typeparam name="T">Type to resolve</typeparam>
        /// <returns></returns>
        public static T Resolve<T>()
        {
            return _container.Resolve<T>();
        }
    }
}
