﻿using DotVVM.Utils.ProjectService;
using DotVVM.Utils.ProjectService.Lookup;
using DotVVM.Utils.ProjectService.Operations.Providers;

namespace DotVVM.CommandLine.Commands.Logic.Compiler
{
    public class DotvvmCompilerProvider: DotvvmToolProvider
    {
        public static DotvvmToolMetadata GetCompilerMetadata(IResolvedProjectMetadata metadata)
        {
            if ((metadata.TargetFramework & TargetFramework.NetFramework) > 0)
            {
                return new DotvvmToolMetadata() {
                    MainModulePath = CombineNugetPath(metadata, "tools\\DotVVM.Compiler.exe"),
                    Version = DotvvmToolExecutableVersion.FullFramework
                };
            }

            return new DotvvmToolMetadata() {
                MainModulePath = CombineNugetPath(metadata, "tools\\dnc\\DotVVM.Compiler.dll"),
                Version = DotvvmToolExecutableVersion.DotNetCore
            };
        }
    }
}