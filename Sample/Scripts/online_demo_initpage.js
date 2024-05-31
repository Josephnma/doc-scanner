
var _iLeft, _iTop, _iRight, _iBottom, bNotShowMessageAgain = false; //These variables are used to remember the selected area

function pageonload() {

  HideLoadImageForLinux();
  initCustomScan();       //CustomScan

  initStyle();
}

function HideLoadImageForLinux() {
  var btnLoad = document.getElementById("btnLoad");
  if (btnLoad) {
    if (Dynamsoft.Lib.env.bLinux || dynamsoft.onlineNavInfo.bChromeOS)
      btnLoad.style.display = "none";
    else
      btnLoad.style.display = "";
  }

  var btnSave = document.getElementById("btnSave");
  if (btnSave) {
    if (Dynamsoft.Lib.env.bLinux || dynamsoft.onlineNavInfo.bChromeOS)
      btnSave.style.display = "none";
    else
      btnSave.style.display = "";
  }
}

function initCustomScan() {

  var _divMessageContainer = document.getElementById("DWTemessage");
  _divMessageContainer.ondblclick = function () {
    this.innerHTML = "";
    _strTempStr = "";
  }

  var twainsource = document.getElementById("source");
  if (twainsource) {
    twainsource.options.length = 0;
    twainsource.options.add(new Option("Looking for devices.Please wait.", 0));
    twainsource.options[0].selected = true;
  }

  if (Dynamsoft.Lib.env.bIE == true && Dynamsoft.Lib.env.bWin64 == true) {
    var o = document.getElementById("samplesource64bit");
    if (o)
      o.style.display = "inline";

    o = document.getElementById("samplesource32bit");
    if (o)
      o.style.display = "none";
  }
}

function setDefaultValue() {
  var vGray = document.getElementById("Gray");
  if (vGray)
    vGray.checked = true;

  var varImgTypepng2 = document.getElementById("imgTypepng2");
  if (varImgTypepng2)
    varImgTypepng2.checked = true;
  var varImgTypepng = document.getElementById("imgTypepng");
  if (varImgTypepng)
    varImgTypepng.checked = true;

  var _strDefaultSaveImageName = "WebTWAINImage";
  var _txtFileNameforSave = document.getElementById("txt_fileNameforSave");
  if (_txtFileNameforSave)
    _txtFileNameforSave.value = _strDefaultSaveImageName;

  var _txtFileName = document.getElementById("txt_fileName");
  if (_txtFileName)
    _txtFileName.value = _strDefaultSaveImageName;

  if (document.getElementById("ADF"))
    document.getElementById("ADF").checked = true;
}


var DWObject, deviceLis;            // The DWT Object
var DWTSourceCount = 0;
var currentIndex = -1;

// Check if the control is fully loaded.
function Dynamsoft_OnReady() {

  var liNoScanner = document.getElementById("pNoScanner");
  // If the ErrorCode is 0, it means everything is fine for the control. It is fully loaded.
  DWObject = Dynamsoft.DWT.GetWebTwain('dwtcontrolContainer');
  if (DWObject) {
    if (DWObject.ErrorCode == 0) {
      var thumbnailViewer = DWObject.Viewer.createThumbnailViewer();
      thumbnailViewer.size = "25%";
      thumbnailViewer.showPageNumber = true;
      thumbnailViewer.selectedPageBackground = thumbnailViewer.background;
      thumbnailViewer.selectedPageBorder = "solid 2px #FE8E14";
      thumbnailViewer.hoverPageBorder = "solid 2px #FE8E14";
      thumbnailViewer.placeholderBackground = "#D1D1D1";
      thumbnailViewer.show();
      thumbnailViewer.hoverPageBackground = thumbnailViewer.background;
      thumbnailViewer.on("click", Dynamsoft_OnMouseClick);
      thumbnailViewer.on('dragdone', Dynamsoft_OnIndexChangeDragDropDone);
      thumbnailViewer.on("keydown", Dynamsoft_OnKeyDown);
      DWObject.Viewer.on("wheel", Dynamsoft_OnMouseWheel);  //H5 only
      DWObject.Viewer.on("OnPaintDone", Dynamsoft_OnMouseWheel);   //ActiveX only

      DWObject.Viewer.allowSlide = false;
      $('#DWTNonInstallContainerID').hide();

      DWObject.IfAllowLocalCache = true;
      DWObject.ImageCaptureDriverType = 4;
      setDefaultValue();

      var twainsource = document.getElementById("source");
      if (!twainsource) {
        twainsource = document.getElementById("webcamsource");
      }

      if (twainsource) {
        twainsource.options.length = 0;
        deviceList = [];
        DWObject.GetDevicesAsync().then(function (devices) {
          var vCount = devices.length;
          DWTSourceCount = vCount;
          for (var i = 0; i < vCount; i++) { // Get how many sources are installed in the system
            twainsource.options.add(new Option(devices[i].displayName, i)); // Add the sources in a drop-down list
            deviceList.push(devices[i]);
          }

          if (vCount == 0) {
            downloadSamplePDF();
          }

          // If source list need to be displayed, fill in the source items.
          if (vCount == 0) {
            if (liNoScanner) {
              if (Dynamsoft.Lib.env.bWin) {

                liNoScanner.style.display = "block";
                liNoScanner.style.textAlign = "center";
              }
              else
                liNoScanner.style.display = "none";
            }
          }

          if (vCount > 0) {
            source_onchange(false);
          }

          var btnScan = document.getElementById("btnScan");
          if (btnScan) {
            if (vCount == 0)
              document.getElementById("btnScan").disabled = true;
            else {
              document.getElementById("btnScan").disabled = false;
              var btnScan = $("#btnScan");
              if (btnScan)
                btnScan.addClass('btnScanActive');
            }
          }


          if (!Dynamsoft.Lib.env.bWin && vCount > 0) {
            if (document.getElementById("lblShowUI"))
              document.getElementById("lblShowUI").style.display = "none";
            if (document.getElementById("ShowUI"))
              document.getElementById("ShowUI").style.display = "none";
          }
          else {
            if (document.getElementById("lblShowUI"))
              document.getElementById("lblShowUI").style.display = "";
            if (document.getElementById("ShowUI"))
              document.getElementById("ShowUI").style.display = "";
          }

          if (document.getElementById("ddl_barcodeFormat")) {
            for (var index = 0; index < BarcodeInfo.length; index++)
              document.getElementById("ddl_barcodeFormat").options.add(new Option(BarcodeInfo[index].desc, index));
            document.getElementById("ddl_barcodeFormat").selectedIndex = 0;
          }

          re = /^\d+$/;
          strre = /^[\s\w]+$/;
          refloat = /^\d+\.*\d*$/i;

          _iLeft = 0;
          _iTop = 0;
          _iRight = 0;
          _iBottom = 0;

          for (var i = 0; i < document.links.length; i++) {
            if (document.links[i].className == "ClosetblLoadImage") {
              document.links[i].onclick = closeDivNoScanners_onclick;
            }
          }
          if (vCount == 0) {
            if (Dynamsoft.Lib.env.bWin) {
              if (document.getElementById("div_ScanImage").style.display == "")
                showDivNoScanners_onclick();
            }
          }
          else {
            var divBlank = document.getElementById("divBlank");
            if (divBlank)
              divBlank.style.display = "none";
          }

          updatePageInfo();

          DWObject.RegisterEvent('CloseImageEditorUI', Dynamsoft_CloseImageEditorUI);
          DWObject.RegisterEvent('OnBitmapChanged', Dynamsoft_OnBitmapChanged);
          DWObject.RegisterEvent("OnPostTransfer", Dynamsoft_OnPostTransfer);
          DWObject.RegisterEvent("OnPostLoad", Dynamsoft_OnPostLoadfunction);
          DWObject.RegisterEvent("OnPostAllTransfers", Dynamsoft_OnPostAllTransfers);
          DWObject.RegisterEvent("OnGetFilePath", Dynamsoft_OnGetFilePath);
          DWObject.Viewer.on("pageAreaSelected", Dynamsoft_OnImageAreaSelected);
          DWObject.Viewer.on("pageAreaUnselected", Dynamsoft_OnImageAreaDeselected);
        }).catch(function (exp) {
          checkErrorStringWithErrorCode(-1, exp.message);
        });
      }
    }
  }

  if (typeof (window['start_init_dcs']) == 'function') {
    window['start_init_dcs']();
  }
}


function showDivNoScanners_onclick() {
  switch (document.getElementById("divNoScanners").style.visibility) {
    case "hidden": document.getElementById("divNoScanners").style.visibility = "visible";
      document.getElementById("Resolution").style.visibility = "hidden";
      break;
    case "visible":
      document.getElementById("divNoScanners").style.visibility = "hidden";
      document.getElementById("Resolution").style.visibility = "visible";
      break;
    default: break;
  }

  return false;
}

function closeDivNoScanners_onclick() {
  document.getElementById("divNoScanners").style.visibility = "hidden";
  document.getElementById("Resolution").style.visibility = "visible";
  return false;
}

//--------------------------------------------------------------------------------------
//************************** Used a lot *****************************
//--------------------------------------------------------------------------------------
function updatePageInfo() {
  if (document.getElementById("DW_TotalImage"))
    document.getElementById("DW_TotalImage").value = DWObject.HowManyImagesInBuffer;
  if (document.getElementById("DW_CurrentImage"))
    document.getElementById("DW_CurrentImage").value = DWObject.CurrentImageIndexInBuffer + 1;
  updateZoomInfo();
}

function updateZoomInfo() {
  if (document.getElementById("DW_spanZoom")) {
    if (DWObject.HowManyImagesInBuffer == 0)
      document.getElementById("DW_spanZoom").value = "100%";
    else
      document.getElementById("DW_spanZoom").value = Math.round(DWObject.Viewer.zoom * 100) + "%";
  }
}


var _strTempStr = "";       // Store the temp string for display
function appendMessage(strMessage) {
  _strTempStr += strMessage;
  var _divMessageContainer = document.getElementById("DWTemessage");
  if (_divMessageContainer) {
    _divMessageContainer.innerHTML = _strTempStr;
    _divMessageContainer.scrollTop = _divMessageContainer.scrollHeight;
  }
}

function checkIfImagesInBuffer() {
  if (DWObject.HowManyImagesInBuffer == 0) {
    appendMessage("<span style='color:#cE5E04'><b>There is no image in the buffer.</b></span><br />")
    return false;
  }
  else
    return true;
}

function checkErrorString() {
  return checkErrorStringWithErrorCode(DWObject.ErrorCode, DWObject.ErrorString);
}

function checkErrorStringWithErrorCode(errorCode, errorString, responseString) {
  if (errorCode == 0) {
    appendMessage("<b>" + errorString + "</b><br />");

    return true;
  }
  if (errorCode == -2115) //Cancel file dialog
    return true;
  else {
    if (errorCode == -2003) {
      var ErrorMessageWin = window.open("", "ErrorMessage", "height=500,width=750,top=0,left=0,toolbar=no,menubar=no,scrollbars=no, resizable=no,location=no, status=no");
      ErrorMessageWin.document.writeln(responseString); //DWObject.HTTPPostResponseString);
    }
    appendMessage("<span style='color:#cE5E04'><b>" + errorString + "</b></span><br />");
    return false;
  }
}

function enableButtonForCrop(bEnable) {
  if (bEnable) {
    var btnCrop = document.getElementById("btnCrop");
    if (btnCrop)
      btnCrop.style.display = "";
    var btnCropGray = document.getElementById("btnCropGray");
    if (btnCropGray)
      btnCropGray.style.display = "none";
  } else {
    var btnCrop = document.getElementById("btnCrop");
    if (btnCrop)
      btnCrop.style.display = "none";
    var btnCropGray = document.getElementById("btnCropGray");
    if (btnCropGray)
      btnCropGray.style.display = "";
  }
}

function showCustomInfo() {
  var customDetail = document.getElementById("customDetail");
  customDetail.style.display = "";
}

function hideCustomInfo() {
  var customDetail = document.getElementById("customDetail");
  customDetail.style.display = "none";
}

function showUploadedFilesDetail() {
  var customDetail = document.getElementById("uploadedFilesDetail");
  customDetail.style.display = "";
}

function hideUploadedFilesDetail() {
  var customDetail = document.getElementById("uploadedFilesDetail");
  customDetail.style.display = "none";
}

//--------------------------------------------------------------------------------------
//************************** Used a lot *****************************
//--------------------------------------------------------------------------------------
function ds_getleft(el) {
  var tmp = el.offsetLeft;
  el = el.offsetParent
  while (el) {
    tmp += el.offsetLeft;
    el = el.offsetParent;
  }
  return tmp;
}

function ds_gettop(el) {
  var tmp = el.offsetTop;
  el = el.offsetParent
  while (el) {
    tmp += el.offsetTop;
    el = el.offsetParent;
  }
  return tmp;
}

function Over_Out_DemoImage(obj, url) {
  obj.src = url;
}

function initStyle() {
  
  var newCssStyle = [], screenWidth = screen.width, screenHeight = screen.height, bIE = false;

  if(screenWidth>1600 && screenWidth<3441 && screenHeight>1200 && screenHeight<2000) {
    newCssStyle.push('\
      html,body { font-size: 16px; }\
    ');
  }


  if(screenWidth<=1920){
    newCssStyle.push('\
      .ds-dwt-content { width:983px;  }\
      #divEdit{ width:663px; }\
      #DWTcontainerTop,#dwtcontrolContainer,#dwt-NonInstallContainerID { width:665px; }\
      #ScanWrapper,#DWTdivMsg { width:315px;  }\
      #divNoScanners { width:275px;  }\
    ');
  } else if(screenWidth>1920 && screenWidth<3441) {
    newCssStyle.push('\
      .ds-dwt-content { width:1395px;  }\
      #divEdit { width:928px; }\
      #DWTcontainerTop,#dwtcontrolContainer,#dwt-NonInstallContainerID { width:930px; }\
      #ScanWrapper,#DWTdivMsg { width:455px;  }\
      #divNoScanners { width:415px;  }\
    ');
  } else {
    newCssStyle.push('\
      .ds-dwt-content { width:2820px;  }\
      #divEdit { width:1898px; }\
      #DWTcontainerTop,#dwtcontrolContainer,#dwt-NonInstallContainerID { width:1900px; }\
      #ScanWrapper,#DWTdivMsg { width:900px;  }\
      #divNoScanners { width:515px;  }\
    ');
  }

  if(screenHeight<=1080){
    newCssStyle.push('\
      #dwt-NonInstallContainerID,#dwtcontrolContainer,#ScanWrapper  { height:760px; }\
    ');
  } else if(screenHeight>1080 && screenHeight<1440){
    newCssStyle.push('\
      #dwt-NonInstallContainerID,#dwtcontrolContainer,#ScanWrapper { height:890px; }\
    ');
  } else if(screenHeight>=1440 && screenHeight<2000){
    newCssStyle.push('\
      #dwt-NonInstallContainerID,#dwtcontrolContainer,#ScanWrapper { height:1050px; }\
    ');
  } else {
    newCssStyle.push('\
      #dwt-NonInstallContainerID,#dwtcontrolContainer,#ScanWrapper { height:1900px; }\
    ');
  }
  
  if(screenWidth>1440 && screenWidth<3441 && screenHeight>1080 && screenHeight<2000){
    newCssStyle.push('\
      .operateGrp input[type="radio"] { width:25px; height:20px; }\
      #divProductDetail li:first-child label:first-child,  #divProductDetail li:nth-child(2) label:first-child { width:210px !important; } \
      #divSaveDetail li p { margin-bottom: 3px; }\
      #divSaveDetail li label { margin-right: 30px; }\
      #divSaveDetail li input[type="radio"], #divSaveDetail li input[type="checkbox"] { width:18px; height:18px; vertical-align: middle; }\
      #divSaveDetail #txt_CustomInfo { margin-top: 10px; }\
      #resultWrap { min-height:80px; }\
      #resultWrap #div-uploadedFile tr { height:30px; }\
      #resultWrap .title { font-size:16px; }\
      #source { margin-top: 10px; }\
      label[for="BW"] { margin-left: 15px !important; }\
      #Resolution { margin-left: 14px; }\
      #divProductDetail li label input[type="radio"] { width:18px; height:18px; }\
      #ScanWrapper select, #divSaveDetail input[type="text"] { height:30px; }\
      #ScanWrapper input[type="checkbox"], #ScanWrapper input[type="radio"] { margin-right: 6px; }\
    ');
  }

  if(screenHeight<=1024) {
    if((screenWidth==1440 || screenWidth==1600) && screenHeight==900) {
      newCssStyle.push('\
      #tabCon { height:255px }\
      ');
    } else {
      newCssStyle.push('\
        #tabCon { height:245px } \
      ');
    }
  } else if(screenHeight<2000) {
    if(screenWidth==1920 && screenHeight==1080 
      || screenWidth==1680 && screenHeight==1050) {
      newCssStyle.push('\
        #tabCon { height:242px; padding-top: 15px }\
      ');
    } else if(screenWidth==1400 && screenHeight==1050) {
      newCssStyle.push('\
        #tabCon { height:255px; padding-top: 15px }\
      ');
    } else if(screenWidth>3000 && screenHeight<=1080) {
      newCssStyle.push('\
        #tabCon { height:560px; padding-top: 15px }\
      ');
    } else {
      newCssStyle.push('\
        #tabCon { height:240px; padding-top: 15px }\
      ');
    }
  }

  if(screenHeight<=1024){
    
    if(screenHeight == 900) {
      newCssStyle.push('\
      #DWTdivMsg { height:198px }\
      ');
    } else {
      newCssStyle.push('\
      #DWTdivMsg{ height:210px; }\
      ');
    }
  } else if(screenHeight>1024 && screenHeight<=1200) {
    
    if(screenWidth==1400 && screenHeight==1050) {
      newCssStyle.push('\
      #DWTdivMsg { height:200px }\
      ');
    } else if(screenWidth==2048 && screenHeight==1152) {
      newCssStyle.push('\
        #DWTdivMsg { height:282px }\
      ');
    } else if(screenWidth==1600 && screenHeight==1200) {
      newCssStyle.push('\
      #DWTdivMsg { height:266px }\
      ');
    } else if(screenWidth==1920 && screenHeight==1200) {
      newCssStyle.push('\
      #DWTdivMsg { height:300px }\
      ');
    }  else if(screenWidth==3840 && screenHeight==1080) {
      newCssStyle.push('\
      #DWTdivMsg { height:350px }\
      ');
    } else if(screenWidth<3441) {
      newCssStyle.push('\
      #DWTdivMsg { height:210px }\
      ');
    }
    
  } else if(screenHeight>1200) {

    if(screenHeight==1392 || screenHeight==1344) {
      newCssStyle.push('\
      #DWTdivMsg { height:285px }\
      ');
    } else if(screenHeight<2000) {
      newCssStyle.push('\
        #DWTdivMsg{ height:440px; }\
      ');
    } else {
      newCssStyle.push('\
        #DWTdivMsg{ height:600px; }\
      ');
    }

    
  }

  if(screenHeight<900){
    newCssStyle.push('\
    #dwtcontrolContainer { margin: 5px 0 20px 0; }\
    ');
  } else if(screenHeight>1200 && screenHeight<2000){
    newCssStyle.push('\
      #divSaveDetail li:nth-child(2) { padding-top: 5px; }\
    ');
  }
  newCssStyle.push('.ds-dwt-content { display:block }');
  
  if(bIE) {
    // IE
    window.style=newCssStyle.join('');
    document.createStyleSheet("javascript:style");
  } else {
    // Chrome / FF
    var styleEl = document.createElement("style");
    styleEl.innerHTML=newCssStyle.join('');
    document.body.appendChild(styleEl);
  }
}
