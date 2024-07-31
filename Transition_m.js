import { LightningElement,api,track, wire } from 'lwc';
import { NavigationMixin } from "lightning/navigation";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadStyle } from 'lightning/platformResourceLoader';
import LightningCardCSS from '@salesforce/resourceUrl/newPreviousResForm';
import AccessCheck from '@salesforce/apex/DEL_StepEventHandler.getUserDetails';
import { getRecord } from 'lightning/uiRecordApi';

export default class Del_TransitionMeeting extends NavigationMixin(LightningElement) {
    @api recordId;
    @track parentId;
    @track isShowModal=false;
    @track avoidRec=true;
    @api modeOfOperation='view';
    @api isPrint = false;
   // @track require=false;
   // @track isValid=false;
	activeSections = ['Z','C', 'D', 'E'];
    @track disableSaveButton=false;
    @track showLoading = false;
    @api objectApiName = "DEL_Transition_Meeting__c";
    @track caseURL;
    
    @wire(getRecord, {recordId: "$recordId", fields : ['DEL_Transition_Meeting__c.Case_Number__c']})
    wiredRecord({error, data}){
        if(data){
            console.log("Case Number: ", data.fields.Case_Number__c.value);
            this.parentId = data.fields.Case_Number__c.value;
            this.caseURL = "/ProviderPortal/s/detail/"+this.parentId;
        }
    }

    renderedCallback(){
        console.log("Rendered Redirect Enabled Case", this.parentId);
    }

    connectedCallback(){  
        if(this.isPrint){
            this.activeSections = ['Z','C', 'A', 'B'];
        }
        if(this.modeOfOperation=='view'){
         this.modeOfOperation=false;
         this.isShowModal=false;
        }else if(this.modeOfOperation=='new' && this.avoidRec){
                AccessCheck()
                .then(result => {
                    if(result==false){
                    this.avoidRec=false;
                    this.isShowModal=false;
                    alert('You dont have sufficient access to Create');
                    this.NavigateTo('DEL_Case__c','standard__recordRelationshipPage');
                }else{
                    this.modeOfOperation=true;
                    this.isShowModal=true;
                }
                })
                .catch(error => {
                    console.log('Error here', JSON.stringify(error));
                });         
        }
        Promise.all([loadStyle( this, LightningCardCSS )]).then(() => {
         console.log( 'Files loaded' );
     })
     .catch(error => {
         console.log( error.body.message );
     });
     }

     handleSignError(event){
        this.showLoading = false;
        this.disableSaveButton=false;
        this.loaded =  true;
        let errCatched;
      
        if(event.detail.output.errors !='' && event.detail.output.errors!=undefined && event.detail.output.errors[0].message != null && event.detail.output.errors[0].message != undefined){
            errCatched=event.detail.output.errors[0].message;
        }
        if(errCatched!='' && errCatched !=undefined){
            this.showToast('Error', errCatched, 'error'); 
        }       
    }    

    handleSignSuccess(event){
        this.isShowModal = false;
        this.showToast('Success', 'Record saved Successfully', 'Success');
        this.NavigateTo('DEL_Case__c','standard__recordRelationshipPage');
    }

    handleOnSignSubmit(event)   {
        this.showLoading = true;
        this.disableSaveButton=true;
        const fields = event.detail.fields;
        fields.Manual_Created__c=true;
        this.template.querySelector('lightning-record-edit-form').submit(fields);
    }

    hideModalBox() { 
        this.avoidRec=false;
        this.isShowModal=false;
        this.NavigateTo('DEL_Case__c','standard__recordRelationshipPage');
        
        setTimeout(location.reload.bind(location), 1000);
    }

    showToast(theTitle, theMessage, theVariant,mode) {
        const event = new ShowToastEvent({
                title: theTitle,
                message: theMessage,
                variant: theVariant,
                mode:mode
        });
        this.dispatchEvent(event);
}
NavigateTo(objectName,type){
    this[NavigationMixin.Navigate]({
        type: type,
        attributes: {
            recordId: this.parentId,
            objectApiName: objectName,
            relationshipApiName: 'Transition_Meetings__r',
            actionName: 'view'
        },
    
    });
    setTimeout(location.reload.bind(location), 0);

}

redirectToCase(){
    window.location.replace(this.caseURL);
}

handleClick(){
    const validSubmit = [...this.template.querySelectorAll('.lightning-input-field')]
    .reduce((validSoFar, input_Field_Reference) => {
        input_Field_Reference.reportValidity();
        return validSoFar && input_Field_Reference.checkValidity();
    }, true);
}
}
