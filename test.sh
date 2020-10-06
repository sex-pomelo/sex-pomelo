#!/bin/bash
######################################################################
##                                                                  ##
##   遍历指定目录获取当前目录下指定后缀（如txt和ini）的文件名            ##
##                                                                  ##
######################################################################
#set -e
 
##递归遍历
traverse_dir()
{
    local filepath=$1
    for file in `ls $filepath`
    do
        if [ -d ${filepath}/$file ]; then
          #递归
          #echo ${filepath}/$file
          traverse_dir ${filepath}/$file
        else
          #调用查找指定后缀文件
          check_suffix ${filepath}/$file
        fi
    done
}
 
 
##获取后缀为txt或ini的文件
check_suffix()
{
    local file=$1
    
    if [ "${file##*.}"x = "js"x ];then
        mocha $file
        if [ "$?" -ne 0 ]; then
          echo "$file Run Error, exit Code $runErr"
          exit
        fi
    fi    
}
 
#测试指定目录  /data_output/ci/history
traverse_dir ./test